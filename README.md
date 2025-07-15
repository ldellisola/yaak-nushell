# YAAK Nushell Plugin

> Copy request as a nushell http command

This plugin for [YAAK](https://yaak.app/) allows you to copy any HTTP request as a [Nushell](https://www.nushell.sh/) command.

## How it works

The plugin registers a new "Copy as Nushell" action on every request. When clicked, it generates a `http` command for nushell and copies it to the clipboard.

## Features

*   Converts HTTP requests to nushell `http` commands.
*   Supports GET, POST, PUT, DELETE, and PATCH methods.
*   Includes headers in the generated command.
*   Handles request body for methods that support it.
*   Supports GraphQL requests.

## Development

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Build the plugin: `npm run build`
