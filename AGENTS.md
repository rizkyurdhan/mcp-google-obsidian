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

## Deployment lessons

- Keep `OBSIDIAN_REST_API_KEY` in `.env`; never hardcode a placeholder or real key in Compose. Compose-level values override `env_file` values.
- Keep `obsidian-config/`, `.env`, `tokens.json`, `node_modules/`, `dist/`, and `.git/` out of Docker build context. The Obsidian config is runtime state and may contain protected files; credentials must not enter image layers.
- The MCP container mounts `/opt/docker/obsidian-vault/Bismillahirrohmanirrahim` as `/vault`. The Obsidian container mounts the parent `/opt/docker/obsidian-vault`; confirm the application opens the nested folder as the vault.
- The bridge sync status tracks Google Workspace note imports/exports. It is not Obsidian Sync. A test note created through MCP has been verified to reach iOS through native Sync, and the desktop GUI renders. The test note remains in the vault. The REST adapter is selected only when the Local REST API endpoint accepts the configured key; otherwise the server falls back to filesystem access.
- Tailscale HTTPS `8443` proxies the GUI via host `3001`; TCP `3002` forwards MCP via host `3005`. Compose publishes those host ports on all interfaces: Tailscale Serve alone does not restrict direct access.
- The Obsidian container uses UID/GID `1001:1001` and `1gb` shared memory. Its persistent Wayland launcher is `obsidian-config/.config/labwc/autostart`. Selkies HTTP 200 is not proof of a working live stream; inspect the app/renderer and shared memory if blank. See `MCP-Docker-Setup-Guide.md` for runtime and security caveats.
- Verify deployment with `docker compose up -d --build`, then inspect sanitized logs and test a read-only vault listing. Never print API keys, OAuth tokens, or note content.
