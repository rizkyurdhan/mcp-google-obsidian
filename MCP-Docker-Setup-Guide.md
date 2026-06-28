# MCP Docker Setup Guide

Step-by-step guide for setting up the `mcp-google-obsidian` Docker infrastructure from scratch.

## Prerequisites
- Docker and Docker Compose installed on your server
- Tailscale installed and authenticated on your server
- A Google Cloud Console project with OAuth credentials
- An Obsidian vault (folder of markdown files)

## Step 1: Clone and Configure Environment
```bash
cd /opt/docker
git clone git@github.com:rizkyurdhan/mcp-google-obsidian.git
cd mcp-google-obsidian
```

Create `.env` file with:
```
MCP_TRANSPORT=http
MCP_HTTP_PORT=3000
LOG_LEVEL=info
TOKEN_STORAGE_PATH=/app/tokens.json
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://srv1757576.tailf459bb.ts.net:3005/callback
OBSIDIAN_VAULT_PATH=/vault
OBSIDIAN_REST_API_URL=https://obsidian:27124
OBSIDIAN_REST_API_KEY=your_api_key_from_plugin
```

## Step 2: Create Vault Directory
```bash
sudo mkdir -p /opt/docker/obsidian-vault
sudo chown -R 1000:1000 /opt/docker/obsidian-vault
```

## Step 3: Create tokens.json
```bash
touch tokens.json
sudo chown 1000:1000 tokens.json
```
> **Important:** This file MUST exist as a file before `docker compose up`. If it doesn't exist, Docker creates it as a directory, causing `EISDIR` errors.

## Step 4: Build and Start
```bash
sudo docker compose up --build -d
```

## Step 5: Configure Obsidian via Web GUI
1. Access the Obsidian GUI at `https://srv1757576.tailf459bb.ts.net:8443`
2. Open `/vault` as your vault
3. Settings → Community Plugins → Turn off Safe Mode
4. Install "Local REST API" plugin
5. Enable the plugin and copy the API Key
6. Paste the key into `.env` as `OBSIDIAN_REST_API_KEY`
7. Restart: `sudo docker compose up -d`

### If Community Plugin Browser Shows Black Screen
Install the plugin manually from your server terminal:
```bash
sudo mkdir -p /opt/docker/obsidian-vault/Bismillahirrohmanirrahim/.obsidian/plugins/obsidian-local-rest-api
cd /opt/docker/obsidian-vault/Bismillahirrohmanirrahim/.obsidian/plugins/obsidian-local-rest-api
sudo wget https://github.com/coddingtonbear/obsidian-local-rest-api/releases/latest/download/main.js
sudo wget https://github.com/coddingtonbear/obsidian-local-rest-api/releases/latest/download/manifest.json
sudo wget https://github.com/coddingtonbear/obsidian-local-rest-api/releases/latest/download/styles.css
sudo chown -R 1000:1000 /opt/docker/obsidian-vault/Bismillahirrohmanirrahim/.obsidian
sudo docker compose restart obsidian
```

## Step 6: Configure Tailscale
```bash
# MCP Server endpoint (raw TCP for SSE streaming)
sudo tailscale serve --bg --tcp 3002 tcp://localhost:3005

# Obsidian GUI (HTTPS proxy for KasmVNC)
sudo tailscale serve --bg --https 8443 http://localhost:3001
```

Verify: `sudo tailscale serve status`

## Step 7: Google OAuth
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add redirect URI: `http://srv1757576.tailf459bb.ts.net:3005/callback`
4. Enable required APIs: Drive, Docs, Calendar, Gmail, Contacts, Sheets, Slides, Tasks, Admin SDK
5. Visit `http://srv1757576.tailf459bb.ts.net:3005/auth` from your browser
6. Log in and approve permissions
7. Tokens are automatically saved to `tokens.json`

## Step 8: Connect Claude Code
```bash
claude mcp add --transport sse google-obsidian http://srv1757576.tailf459bb.ts.net:3002/sse
```
Verify: `/mcp list`

## Lessons Learned
- **EISDIR bug:** Always `touch tokens.json` before first `docker compose up`
- **Port collision:** Tailscale and Docker cannot share a host port. Use different ports (3002 for Tailscale, 3005 for Docker) and link them
- **KasmVNC HTTPS:** KasmVNC refuses HTTP connections. Use `DOCKER_MODS=linuxserver/mods:universal-kasmvnc-http` to force HTTP mode, then wrap with Tailscale HTTPS proxy (`--https 8443`)
- **KasmVNC sub-path:** KasmVNC cannot run under a sub-path like `/obsidian`. It must be at the root of its port
- **Electron black screen:** Add `APP_ARGS=--disable-gpu --disable-software-rasterizer --disable-dev-shm-usage --no-sandbox` to prevent crashes. If community plugins still black-screen, install plugins manually via filesystem
- **Google OAuth redirect:** Google rejects raw IP addresses. Use your `.ts.net` Tailscale domain instead
- **SSE vs stdio:** Both transports coexist. Default is stdio (no env var needed). Docker uses `MCP_TRANSPORT=http`

## Maintenance
```bash
# Restart after .env changes
sudo docker compose up -d

# Rebuild after code changes
sudo docker compose up --build -d

# View logs
sudo docker compose logs -f mcp-server
sudo docker compose logs -f obsidian

# Full reset
sudo docker compose down -v
sudo rm -rf obsidian-config/*
sudo docker compose up --build -d
```