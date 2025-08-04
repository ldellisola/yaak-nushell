import {
  HttpRequest,
  HttpRequestHeader,
  HttpUrlParameter,
  PluginDefinition,
} from "@yaakapp/api";
import {
  Authentication,
  parseAuthentication,
  hasAuthenticationHeaders,
} from "./authentication";

export const plugin: PluginDefinition = {
  httpRequestActions: [
    {
      label: "Copy as Nushell http",
      icon: "copy",
      async onSelect(ctx, args) {
        const rendered_request = await ctx.httpRequest.render({
          httpRequest: args.httpRequest,
          purpose: "preview",
        });

        const data = await convertToNushellHttp(rendered_request);
        await ctx.clipboard.copyText(data);
        await ctx.toast.show({
          message: "Nushell script copied to clipboard",
          icon: "copy",
          color: "success",
        });
      },
    },
  ],
};

export async function convertToNushellHttp(request: HttpRequest) {
  const xs = ["http"];

  xs.push(request.method?.toLowerCase() ?? "get");

  addUrl(
    xs,
    request.url ?? "",
    (request.urlParameters ?? []).filter(onlyEnabled),
  );

  addHeaders(
    xs,
    request.method,
    (request.headers ?? []).filter(onlyEnabled),
    parseAuthentication(request),
  );

  addBody(xs, request);

  xs.push("--raw");
  xs.push("--allow-errors");
  return xs.join(" ").replace(/\n/g, String.fromCharCode(13));
}

function addBody(xs: string[], request: HttpRequest) {
  if (request.method?.toLowerCase() === "get") return;

  if (request.bodyType === "application/x-www-form-urlencoded")
    xs.push(formatBodyAsUrlEncoded(request));
  else if (request.bodyType === "multipart/form-data")
    xs.push(formatBodyAsFormData(request));
  else if (request.bodyType === null) {
    // ignore body
  } else if (typeof request.body?.query === "string")
    xs.push(formatBodyAsGraphQl(request));
  else if (typeof request.body?.text === "string")
    xs.push(`r#'\n${request.body.text}\n'#`);
}

function formatBodyAsGraphQl(request: HttpRequest): string {
  const body = {
    query: request.body.query || "",
    variables: maybeParseJSON(request.body.variables, undefined),
  };
  return `r#'\n${JSON.stringify(body)}\n'#`;
}

function formatBodyAsFormData(request: HttpRequest): string {
  if (!Array.isArray(request.body.form)) return "";
  const body: string[] = [];

  for (const p of (request.body.form ?? []).filter(onlyEnabled)) {
    if (p.file) {
      const filePath = p.value as string;
      const fileName = filePath.split(/[/]/).pop() ?? "";
      body.push(
        `{ name: "${p.name}" filename: "${fileName}" content: (open "${filePath}") }`,
      );
    } else {
      body.push(`{ name: "${p.name}" value: "${p.value}" }\n`);
    }
  }
  return `r#'\n[\n  ${body.join(", ")}]\n'#`;
}

function formatBodyAsUrlEncoded(request: HttpRequest): string {
  if (!Array.isArray(request.body.form)) return "";
  const body: string[] = [];

  for (const p of (request.body.form ?? []).filter(onlyEnabled)) {
    if (p.file) continue;

    const str = `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`;
    body.push(str.replace("%20", "+"));
  }
  return body.join("&");
}

function addUrl(xs: string[], url: string, urlParameters: HttpUrlParameter[]) {
  if (urlParameters.length == 0) {
    xs.push(url);
    return;
  }

  const parameters: string[] = [];
  for (const p of urlParameters) {
    parameters.push(
      `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`,
    );
  }

  xs.push(`${url}?${parameters.join("&")}`);
}

function addHeaders(
  xs: string[],
  method: string,
  headers: HttpRequestHeader[],
  authentication?: Authentication,
) {
  if (method.toLowerCase() === "get")
    headers = headers.filter((t) => t.name.toLowerCase() !== "content-type");

  if (headers.length === 0 && !hasAuthenticationHeaders(authentication)) return;

  xs.push("--headers");
  xs.push("{");
  for (const h of headers) {
    xs.push(`${h.name}: "${h.value}"`);
  }

  if (authentication?.type === "basic") {
    xs.push(
      `Authorization: "Basic ${btoa(`${authentication.username}:${authentication.password}`)}"`,
    );
  } else if (authentication?.type === "bearer") {
    xs.push(`Authorization: "Bearer ${authentication.token ?? ""}"`);
  }

  xs.push("}");
}

function onlyEnabled(v: { name?: string; enabled?: boolean }): boolean {
  return v.enabled !== false && !!v.name;
}

function maybeParseJSON<T>(v: string, fallback: T) {
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}
