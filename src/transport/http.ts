import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// HTTP transport imports will be implemented in Phase 5
import { logger } from "../utils/logger.js";

export async function startHttpTransport(server: McpServer, port: number) {
  // TODO: Implement Streamable HTTP transport
  logger.info(`MCP Server HTTP transport placeholder on port ${port}`);
  throw new Error("HTTP transport not yet implemented in Phase 1");
}
