# MCP Google Obsidian Bridge

A unified Model Context Protocol (MCP) server that brings together Google Workspace, an Obsidian Vault, and a Bridge for workflows between them (specifically geared toward NotebookLM).

## Features

- **Google Workspace (54 tools)**: Gmail, Drive, Calendar, Docs, Sheets, Slides, Tasks, Contacts, Admin SDK.
- **Obsidian Vault (12 tools)**: Note CRUD, Full-text Search, Tag management, Graph connections.
- **Bridge Workflow (4 tools)**: Export Obsidian notes to Google Docs, clean Markdown, merge notes for NotebookLM ingestion.

## Architecture
- Single TypeScript process to handle all 70 tools.
- Dual-mode Obsidian access: Auto-detects Local REST API (`https://localhost:27124`), falls back to FileSystem.
- Bridge layer to sync states in `.mcp-suite-sync.json`.
- Google Auth handles PKCE offline access with token persistence.

## Setup

1. Copy `.env.example` to `.env` and fill out your Google OAuth Client ID and Secret.
2. Specify your `OBSIDIAN_VAULT_PATH` in `.env`.
3. Build the project: `npm run build`
4. Configure your MCP client (e.g. Claude Desktop) with stdio transport to point to `node path/to/MCP-Suite/dist/index.js`.
