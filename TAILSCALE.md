# Tailscale endpoints

The Tailscale Serve routes below are tailnet-only. Compose also publishes host ports 3001 and 3005 on all interfaces; Tailscale Serve does not restrict direct access to those ports. Use firewall rules as appropriate. Check the live routes with `tailscale serve status`.

## Obsidian web GUI

Open the GUI at:

`https://srv1757576.tailf459bb.ts.net:8443`

Route: Tailscale HTTPS `:8443` → `http://localhost:3001` → Obsidian container port `3000` (Selkies web desktop in the current linuxserver image). The GUI opens the canonical vault at `/vault/Bismillahirrohmanirrahim`. This desktop session must be signed into the same Obsidian account and have Sync enabled for changes to reach iOS.

An HTTP 200 from the GUI port only proves the Selkies web page loads — not that the live desktop stream works. The stream also needs the websocket connection and a running Obsidian process (see `MCP-Docker-Setup-Guide.md` troubleshooting).

## MCP HTTP/SSE

- Tailscale TCP `:3002` → `localhost:3005` → MCP container port `3000`.
- SSE client URL: `http://srv1757576.tailf459bb.ts.net:3002/sse`.

The MCP container mounts `/opt/docker/obsidian-vault/Bismillahirrohmanirrahim` as `/vault`, the same vault opened by the GUI. Google Workspace bridge sync status is separate from native Obsidian Sync. A test note created through MCP has been verified to reach iOS via native Sync, and the desktop GUI renders. The test note remains in the vault.

## Verify routes

On the VPS, run:

```bash
sudo tailscale serve status
curl -I http://127.0.0.1:3001/
```

The GUI route should show `:8443` proxying to `localhost:3001`. The MCP route should show `:3002` forwarding to `localhost:3005`. Do not use the bare tailnet hostname for the GUI; it may route to a different service.
