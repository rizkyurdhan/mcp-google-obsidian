# MCP Docker Setup Guide

Step-by-step guide for setting up the `mcp-google-obsidian` Docker infrastructure from scratch.

## Prerequisites
- Docker and Docker Compose installed on your server
- Tailscale installed and authenticated on your server
- A Google Cloud Console project with OAuth credentials
- An Obsidian vault (folder of markdown files)

## Architecture

```text
MCP client → Tailscale TCP :3002 → host :3005 → MCP :3000
                                                  └→ filesystem /vault (current)
Browser → Tailscale HTTPS :8443 → host :3001 → Obsidian :3000
                                                  └→ Selkies → Wayland → Obsidian
Canonical vault: /opt/docker/obsidian-vault/Bismillahirrohmanirrahim
  MCP: /vault
  GUI: /vault/Bismillahirrohmanirrahim
Obsidian Sync: desktop ↔ Obsidian remote vault ↔ iOS
```

The MCP server tries `https://obsidian:27124` first but currently uses the filesystem adapter. Native Obsidian Sync is independent of MCP and of Google Workspace bridge import/export state.

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
sudo chown -R 1001:1001 /opt/docker/obsidian-vault
```
> The UID/GID must match `PUID`/`PGID` in `docker-compose.yml` (currently `1001`). The canonical vault is `/opt/docker/obsidian-vault/Bismillahirrohmanirrahim`. The MCP container mounts that nested folder directly as `/vault`; the Obsidian container mounts the parent `/opt/docker/obsidian-vault` as `/vault` and opens the nested folder inside the app. Both paths must resolve to the same files.

## Step 3: Create tokens.json
```bash
touch tokens.json
sudo chown 1001:1001 tokens.json
```
> **Important:** This file MUST exist as a file before `docker compose up`. If it doesn't exist, Docker creates it as a directory, causing `EISDIR` errors.

## Step 4: Build and Start
```bash
sudo docker compose up --build -d
```

## Step 5: Configure Obsidian via Web GUI
1. Access the Obsidian GUI at `https://srv1757576.tailf459bb.ts.net:8443`
2. Open `/vault/Bismillahirrohmanirrahim` as your vault (the MCP mounts this same nested vault at `/vault`)
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
sudo chown -R 1001:1001 /opt/docker/obsidian-vault/Bismillahirrohmanirrahim/.obsidian
sudo docker compose restart obsidian
```

## Step 5b: Enable Native Obsidian Sync (for iOS)
The Google Workspace bridge is one-shot import/export only; it does not sync devices. For changes to reach iOS:
1. In the web GUI, enable the core **Sync** plugin (Settings → Core plugins).
2. Sign in with the **same Obsidian account** used on iOS.
3. Connect to the **existing remote vault** — do not create a new one.
4. Verify end-to-end: a test note created through MCP should appear on iOS. This MCP → vault → Sync → iOS path has been verified. The desktop GUI renders and the test note was confirmed on iOS; the test note remains in the vault.

## Step 6: Configure Tailscale
```bash
# MCP Server endpoint (raw TCP for SSE streaming)
sudo tailscale serve --bg --tcp 3002 tcp://localhost:3005

# Obsidian GUI (HTTPS proxy for the Selkies web desktop)
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

## Troubleshooting

### Blank screen / app renderer crash
- The current `lscr.io/linuxserver/obsidian` image serves a **Selkies**-based web desktop. The `DOCKER_MODS=linuxserver/mods:universal-kasmvnc-http` entry in Compose is a legacy leftover from the KasmVNC era.
- **HTTP 200 is not proof of a working desktop.** `curl -I http://127.0.0.1:3001/` returning 200 only means the Selkies web page loads. The live stream additionally needs the websocket connection and a running Obsidian process. Check container logs and the Obsidian process, not just the HTTP status.
- Electron renderer crashes are commonly caused by the default 64 MB `/dev/shm`. Compose sets `shm_size: 1gb` and `APP_ARGS=--disable-gpu --disable-software-rasterizer --disable-dev-shm-usage --no-sandbox`. Keep both if you see blank screens or renderer crashes.
- Check the actual process and shared memory: `docker exec obsidian ps -eo uid,pid,comm,args` and `docker exec obsidian df -h /dev/shm`. A `Trace/breakpoint trap` or renderer exit with low shared memory points to `/dev/shm`, not Tailscale.
- The persistent launcher uses `WAYLAND_DISPLAY=wayland-0` for the application compositor; Selkies captures `wayland-1`. Do not point the app at `wayland-1` merely because that is the capture socket.
- Compose uses `security_opt: seccomp:unconfined` and `--no-sandbox`, weakening container isolation. Host ports 3001 and 3005 are published on all interfaces; Tailscale Serve alone does not restrict direct access. Apply firewall rules as appropriate.

### Wayland launcher (persistent file)
Obsidian is started by `obsidian-config/.config/labwc/autostart` (host path relative to this repo). Because `./obsidian-config` is bind-mounted to `/config`, this file **survives container recreation**. It currently runs:
```bash
(sleep 3; env WAYLAND_DISPLAY=wayland-0 XDG_RUNTIME_DIR=/config/.XDG HOME=/config obsidian) &
```
Caveats:
- The `sleep 3` startup ordering is fragile; if the desktop compositor is not ready, Obsidian may fail to attach. Adjust the delay or display if the stream shows an empty desktop.
- The file also runs `sudo lsiown -R` over `/opt/obsidian` when the session user is not `abc`. Review it before changing `PUID`/`PGID`.
- If you reset `obsidian-config/`, you lose this launcher, the Sync sign-in state, and plugin settings.

### Ownership mismatch
The canonical vault and the current `obsidian-config/` mount are owned by `1001:1001`, matching `PUID`/`PGID`. UID 1000 belonged to earlier runs; do not assume it is still required. Check the image's `/config` initialization and actual write access before changing ownership. The LinuxServer image maps `/config` to its internal `abc` user and initializes it for `PUID`/`PGID`.

## Lessons Learned
- **EISDIR bug:** Always `touch tokens.json` before first `docker compose up`
- **Port collision:** Tailscale and Docker cannot share a host port. Use different ports (3002 for Tailscale, 3005 for Docker) and link them
- **Web desktop HTTPS:** Compose configures `DOCKER_MODS=linuxserver/mods:universal-kasmvnc-http`; Tailscale HTTPS (`--https 8443`) proxies the host HTTP port. The current image uses Selkies.
- **Web desktop sub-path:** The web desktop cannot run under a sub-path like `/obsidian`. It must be at the root of its port
- **Electron black screen:** Keep `shm_size: 1gb` and `APP_ARGS=--disable-gpu --disable-software-rasterizer --disable-dev-shm-usage --no-sandbox` to prevent renderer crashes. If community plugins still black-screen, install plugins manually via filesystem
- **UID consistency:** Vault ownership must match `PUID`/`PGID` (currently `1001:1001`)
- **Native Sync vs bridge:** The bridge sync state (`.mcp-suite-sync.json`) tracks one-shot Google Docs imports/exports — no watcher, polling, or conflict handling. Device sync (iOS) requires native Obsidian Sync with the same account and remote vault. MCP → vault → Sync → iOS is verified; the desktop GUI renders and the test note remains in the vault
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

# Recreate services without deleting persistent Obsidian state
sudo docker compose up -d --force-recreate
```