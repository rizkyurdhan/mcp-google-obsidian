# Agent Guide

## Project

`mcp-google-obsidian` is an ESM TypeScript MCP server. It exposes Google Workspace, Obsidian, and bridge workflow tools from one process. Source lives under `src/`; build output goes to `dist/`.

## Commands

- `npm run build`: bundle `src/index.ts` with `tsup`.
- `npm run dev`: rebuild while files change.
- `npm test`: run Vitest tests.
- `npx tsc --noEmit`: run strict TypeScript checking.
- `docker compose up --build -d`: build and start Docker services.

Run the smallest relevant check after edits. For source changes, use `npm run build` and `npx tsc --noEmit`; run `npm test` when tests or behavior change.

## Code Layout

- `src/index.ts`, `src/server.ts`: process and MCP server setup.
- `src/google/`: Google API clients and tool registration by service.
- `src/obsidian/`: vault resources and note, search, and graph tools.
- `src/bridge/`: Obsidian-to-Google workflows, Markdown cleanup, merging, and sync state.
- `src/auth/`: OAuth configuration and token handling.

Follow existing TypeScript patterns. Reuse clients, resource helpers, and validation already present before adding new abstractions. Keep changes focused and preserve ESM imports.

## Configuration And Secrets

Configuration loads from `.env`. Never commit `.env`, OAuth credentials, API keys, or token files. `tokens.json` is mounted into the container and must exist as a file before `docker compose up`; it is intentionally ignored by Git.

Important variables include `MCP_TRANSPORT`, `MCP_HTTP_PORT`, `TOKEN_STORAGE_PATH`, Google OAuth credentials, `OBSIDIAN_VAULT_PATH`, `OBSIDIAN_REST_API_URL`, and `OBSIDIAN_REST_API_KEY`. Use `MCP-Docker-Setup-Guide.md` for deployment-specific setup.

## Docker

The MCP server listens on container port `3000`, exposed locally as `3005`. Obsidian uses port `3001` for its web GUI and shares the vault through `/vault`. Do not change host paths, ports, or OAuth redirect settings without updating deployment documentation and client configuration.

## Change Rules

- Prefer the smallest correct change; avoid speculative APIs, wrappers, and dependencies.
- Validate untrusted tool input with existing Zod schemas or the established validation pattern.
- Preserve error handling around Google, Obsidian, filesystem, and token operations.
- Do not edit generated `dist/` output by hand.
- Do not modify deployment secrets or unrelated worktree changes.
