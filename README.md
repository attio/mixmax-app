# Mixmax

Attio app integrating with [Mixmax](https://mixmax.com) — a sales engagement and email productivity platform.

## Overview

Adds a workflow step block that lets users add a contact's email address to a Mixmax sequence directly from an Attio workflow automation. Authentication is per-user via a Mixmax API token.

## Features

- **Workflow block** — add a contact email to any Mixmax sequence, with optional recipient name, as a step in an Attio workflow

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm run dev
```

## Commands

| Command                 | Description              |
| ----------------------- | ------------------------ |
| `pnpm run dev`          | Start dev server         |
| `pnpm run build`        | Build + type-check       |
| `pnpm run lint`         | Run ESLint               |
| `pnpm run lint:fix`     | Run ESLint with auto-fix |
| `pnpm run format`       | Format with Prettier     |
| `pnpm run format:check` | Check formatting         |
| `pnpm run test`         | Run tests                |
| `pnpm run knip`         | Check for dead code      |

## Source folder structure

| Path | Description |
| --- | --- |
| `src/app.ts` | App entry point |
| `src/blocks/add-email-to-sequence/` | Workflow step block — definition, configurator, execute |
| `src/mixmax/` | Mixmax API client, server helpers, and types |
