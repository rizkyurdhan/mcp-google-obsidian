# Exposing the MCP Server via Tailscale

This project uses Server-Sent Events (SSE) via HTTP to allow remote connections.

Since you are using Tailscale, you can securely expose the HTTP port to other devices on your Tailnet (like a laptop running Obsidian) without exposing it to the public internet.

## 1. Start the Docker Container
Run the server using docker-compose:
```bash
docker compose up -d
```

This starts the server and maps port 3000 on your host to port 3000 in the container.

## 2. Expose the Port with Tailscale Serve
On the machine running Docker, run:

```bash
sudo tailscale serve --bg 3000
```

This tells Tailscale to route traffic from your Tailnet to local port 3000 in the background.

## 3. Connect from Remote Client
From your remote client (e.g., Cursor or Obsidian running on another device in your Tailnet), you will connect to the server using the machine's Tailscale domain name or Tailscale IP.

Example URL:
`http://your-server-name.tailnet-name.ts.net:3000/sse`

If connecting via the official MCP client configuration, you would use:
```json
{
  "mcpServers": {
    "mcp-google-obsidian": {
      "command": "node",
      "args": ["path/to/remote/bridge/script.js"] 
      // Note: If the client only supports stdio (like Cursor natively right now), 
      // you might need a small proxy script. But if the client supports SSE URLs natively, 
      // just plug in the URL above.
    }
  }
}
```

## Stopping Tailscale Serve
If you need to stop serving the port over Tailscale, run:
```bash
sudo tailscale serve --bg off
```