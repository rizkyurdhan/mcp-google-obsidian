import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
const server = new McpServer({ name: "test", version: "1.0" });
console.log("Connected?", server.server.transport != null);
