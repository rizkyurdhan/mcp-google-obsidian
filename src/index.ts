import dotenv from "dotenv";
dotenv.config();

import { createServer } from "./server.js";
import { startStdioTransport } from "./transport/stdio.js";
import { startHttpTransport } from "./transport/http.js";
import { logger } from "./utils/logger.js";

async function main() {
  try {
    const server = createServer();
    const transportType = process.env.MCP_TRANSPORT || "stdio";

    if (transportType === "stdio") {
      await startStdioTransport(server);
    } else if (transportType === "http") {
      const port = parseInt(process.env.MCP_HTTP_PORT || "3000", 10);
      await startHttpTransport(server, port);
    } else {
      throw new Error(`Unknown transport: ${transportType}`);
    }
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();
