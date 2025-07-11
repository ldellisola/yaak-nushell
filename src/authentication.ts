import { HttpRequest } from "@yaakapp/api";

type BasicAuthentication = {
  type: "basic";
  disabled?: boolean;
  username: string;
  password: string;
};

type BearerAuthentication = {
  type: "bearer";
  disabled?: boolean;
  token: string;
};

export type Authentication = BasicAuthentication | BearerAuthentication;
type AuthenticationType = "bearer" | "basic";

export function hasAuthenticationHeaders(authentication?: Authentication) {
  if (authentication === undefined) return false;

  if (authentication.disabled === undefined) return true;

  return !authentication.disabled;
}

export function parseAuthentication(
  request: HttpRequest,
): Authentication | undefined {
  if (request.authenticationType === undefined) return undefined;
  else if (request.authenticationType === "none") return undefined;

  return {
    type: request.authenticationType as AuthenticationType,
    ...request.authentication,
  } as Authentication;
}
