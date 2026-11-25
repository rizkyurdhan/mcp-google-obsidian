# MCP Google Obsidian Bridge

A unified Model Context Protocol (MCP) server that brings together Google Workspace, an Obsidian Vault, and a Bridge for workflows between them (specifically geared toward NotebookLM).

## Features

- **Google Workspace (54 tools)**: Gmail, Drive, Calendar, Docs, Sheets, Slides, Tasks, Contacts, Admin SDK.
- **Obsidian Vault (12 tools)**: Note CRUD, Full-text Search, Tag management, Graph connections.
- **Bridge Workflow (4 tools)**: Export Obsidian notes to Google Docs, clean Markdown, merge notes for NotebookLM ingestion.

## Architecture
- Single TypeScript process to handle all 70 tools.
- Dual-mode Obsidian access: Auto-detects Local REST API (`https://localhost:27124` by default; Compose uses `https://obsidian:27124`), falls back to filesystem if unavailable.
- The Google Workspace bridge tracks one-shot import/export state in `.mcp-suite-sync.json`; it is **not** native Obsidian Sync. A test note created through MCP has been verified to reach iOS via native Sync, and the desktop GUI renders. The test note remains in the vault.
- Google Auth handles PKCE offline access with token persistence.

### Docker deployment
- Compose mounts `/opt/docker/obsidian-vault/Bismillahirrohmanirrahim` as `/vault` in the MCP container. The Obsidian container mounts the parent `/opt/docker/obsidian-vault` as `/vault` and opens `/vault/Bismillahirrohmanirrahim`.
- Obsidian runs as UID/GID `1001:1001` with `shm_size: 1gb`. Its Wayland launcher persists in `obsidian-config/.config/labwc/autostart`.
- Tailscale HTTPS `:8443` proxies to the GUI at host `:3001`; Tailscale TCP `:3002` forwards MCP HTTP/SSE to host `:3005`. Compose publishes both host ports on all interfaces, so firewall them as appropriate; Tailscale Serve itself is tailnet-only.
- Selkies HTTP 200 confirms only the web frontend, not a working live desktop stream. See `MCP-Docker-Setup-Guide.md` and `TAILSCALE.md` for setup and troubleshooting.

## Setup

1. Copy `.env.example` to `.env` and fill out your Google OAuth Client ID and Secret.
2. Specify your `OBSIDIAN_VAULT_PATH` in `.env`.
3. Build the project: `npm run build`
4. Configure your MCP client (e.g. Claude Desktop) with stdio transport to point to `node path/to/MCP-Suite/dist/index.js`.
