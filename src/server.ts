import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { logger } from "./utils/logger.js";

// Import services
import { registerGmailTools } from "./google/gmail/tools.js";
import { registerDriveTools } from "./google/drive/tools.js";
import { registerCalendarTools } from "./google/calendar/tools.js";
import { registerDocsTools } from "./google/docs/tools.js";
import { registerGoogleResources } from "./google/resources.js";
import { registerAuthTools } from "./google/auth/tools.js";

import { registerNoteTools } from "./obsidian/notes/tools.js";
import { registerSearchTools } from "./obsidian/search/tools.js";
import { registerTagTools } from "./obsidian/tags/tools.js";
import { registerGraphTools } from "./obsidian/graph/tools.js";
import { registerObsidianResources } from "./obsidian/resources.js";

import { registerBridgeTools } from "./bridge/tools.js";

import { registerExtendedGoogleTools } from "./google/extended/tools.js";
import { registerAdminTools } from "./google/admin/tools.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "mcp-suite",
    version: "1.0.0"
  });

  logger.info("Created McpServer instance");

  // Register tools
  registerGmailTools(server);
  registerDriveTools(server);
  registerCalendarTools(server);
  registerDocsTools(server);
  registerAuthTools(server);

  registerNoteTools(server);
  registerSearchTools(server);
  registerTagTools(server);
  registerGraphTools(server);

  registerBridgeTools(server);
  registerExtendedGoogleTools(server);
  registerAdminTools(server);

  // Register resources
  registerGoogleResources(server);
  registerObsidianResources(server);

  return server;
}
