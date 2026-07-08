# AGENTS.md

This file provides guidance to AI agents who are working on the code in this repository.

## Context

This repository contains an app built with the Attio App SDK.

### What the app does

Mixmax integration for Attio — adds a workflow step block that lets users add a contact's email address to a Mixmax sequence, directly from an Attio workflow automation. Authentication is per-user (user connection via API token).

### External service

**Mixmax** — a sales engagement and email productivity platform.

- API: REST (`https://api.mixmax.com/v1`)
- Auth: API token, passed as `X-API-Token` header — user connection
- Docs: [developer.mixmax.com](https://developer.mixmax.com/reference)

### App SDK entry points in use

| Entry point | ID | Description |
| --- | --- | --- |
| Workflow step block | `add-email-to-sequence` | Add a contact's email address to a Mixmax sequence |

### Source folder structure

| Path | Description |
| --- | --- |
| `src/app.ts` | App entry point |
| `src/blocks/add-email-to-sequence/` | Workflow step block — block definition, configurator, execute |
| `src/mixmax/` | Mixmax API client, server helpers, and types |
| `src/mixmax/mixmax-client.ts` | REST client wrapping `fetch` — returns `@attio/fetchable` results |
| `src/mixmax/get-mixmax.ts` | Factory: calls `getUserConnection()` then instantiates `MixmaxClient` |
| `src/mixmax/list-sequences.server.ts` | Server function to fetch sequences for the configurator dropdown |
| `src/mixmax/types/` | Domain error types and user-facing error message helpers |

### What is the App SDK?

The App SDK is a set of components and functionality to build apps that are embedded directly in the Attio CRM platform.

#### App SDK capabilities

- Use React to render components provided by the `attio/client` package.
- Run server-side code and make API calls to external services using `.server.ts` files.
- Store API tokens using the connections system.
- Receive incoming requests from third-party services via webhooks.
- Subscribe to events e.g. connection.added
- Manage form rendering, validation and submission with `useForm()`.
- Manage data fetching and async caching with `useAsyncCache()` and `useQuery()`.

## Environment

Code for the app may run either in a client-side or server-side context.

### Client-side code

Client-side code runs in the browser. However, it runs inside a safe sandbox, using a custom JS runtime. This means that:

- You MUST NOT render HTML tags directly e.g. `<div>Hello</div>`. Instead, you MUST only use components provided by the App SDK.
- You MUST NOT use custom styles or CSS. Only use the pre-styled components provided by the App SDK.
- You MUST NOT try to read the DOM directly.
- Some browser APIs may not be available.
- `fetch` calls are not allowed. You MUST NOT call `fetch` directly and should instead use `fetch` via server-side functions.

Files which render React components MUST use the `.tsx` extension.

### Server-side code

Server-side code runs in files ending in:

- `.server.ts`
- `.webhook.ts`
- `.event.ts`

Workflow block files will also run in the server (excluding configurators).

Code that any of the above files import will also run in a server-side environment.

Server-side code DOES NOT run in Node.js but instead in a custom JS runtime. While many Node.js APIs are supported, some are not and you may need to factor this into your decision to use certain packages.

## Using the Attio App SDK

Attio provides three packages to help you build apps:

1. `attio/client` - for client-side imports
2. `attio/server` - for server-side imports
3. `attio` - for shared/environment-agnostic imports

IMPORTANT: Before importing from these packages, you MUST always check one of the following to confirm that your import is correct:

1. Existing examples in the codebase
2. TypeScript type definitions and JSDoc strings for the package
3. The Attio SDK documentation

If you are unsure about an import, always check explicitly and do not guess.

## Coding guidelines

- You SHOULD use Zod to validate data from public APIs.
- You SHOULD only include properties in Zod schemas that we explicitly need.
- You SHOULD use try/catch around calls to `.json()`.
- You SHOULD use console.error to capture information about unexpected errors.
- You MUST NOT log sensitive information such as email addresses or passwords.
- You MUST handle API errors gracefully. Do not throw an error within a React component, but instead return a clear fallback UI.
- API wrappers MUST NOT leak transport-layer details (e.g. HTTP status codes) to callers — return a domain error such as `NOT_FOUND` instead. All Mixmax calls return a `@attio/fetchable` result rather than throwing.
- When `getUserConnection()` / `getWorkspaceConnection()` is called, you MUST NOT wrap it in a try/catch. These functions throw special errors that power the connection dialogs in the UI.
- You SHOULD prefer named arguments over positional arguments when using 3 or more arguments.
- You MUST NOT use `any` when typing your code. Type errors MUST be fixed properly as usage of `any` is a likely source of bugs.
- You SHOULD order functions/values within code so that all values are defined before being used. Default export should go at the bottom of a file.

### App-specific guidelines

- `getMixmax()` calls `getUserConnection()` internally — never wrap it in try/catch.
- `MixmaxClient` methods return `MixmaxResult<T>` (a `@attio/fetchable` async result). Callers use `isErrored` / `complete` / `errored` from `@attio/fetchable`.
- The Mixmax API uses `X-API-Token` header auth (not Bearer). Do not change this.
- Mixmax may return `status: "duplicated"` or `status: "unsubscribed"` for recipients — treat these as user-facing errors, not unexpected errors.

### Error messages (user-facing)

- Never dump raw JSON, HTTP status codes, or square brackets in UI error messages.
- Never expose transport-layer details — say "An unexpected error occurred when calling Mixmax's API" not "503 from Mixmax".

### Testing

- Where appropriate, use Vitest to run tests.
- Aim to implement unit testing where it helps increase confidence in the correctness of code.
- Do not test React components using react testing library or similar.
- When passing functions/classes to describe, pass the value directly, do not specify a name in quotes.

## Validation

- You MUST validate all your changes using the commands provided in package.json.
- Run and fix lint rules: `pnpm run lint:fix`
- Validate unused code: `pnpm run knip`
- Run tests: `pnpm run test`
- Validate the build: `pnpm run build`
