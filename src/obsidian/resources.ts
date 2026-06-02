import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getVaultAdapter } from "./vault/index.js";
import { handleError } from "../utils/errors.js";

export function registerObsidianResources(server: McpServer) {
  server.resource(
    "obsidian-vault-stats",
    "obsidian://vault/stats",
    async (uri) => {
      try {
        const adapter = await getVaultAdapter();
        const stats = await adapter.getStats();
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(stats, null, 2)
          }]
        };
      } catch (error) {
        handleError(error, "Failed to fetch vault stats");
      }
    }
  );

  server.resource(
    "obsidian-vault-recent",
    "obsidian://vault/recent",
    async (uri) => {
      try {
        const adapter = await getVaultAdapter();
        const recent = await adapter.getRecent(10);
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(recent, null, 2)
          }]
        };
      } catch (error) {
        handleError(error, "Failed to fetch recent notes");
      }
    }
  );

  server.resource(
    "obsidian-vault-tags",
    "obsidian://vault/tags",
    async (uri) => {
      try {
        const adapter = await getVaultAdapter();
        const tags = await adapter.listTags();
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(tags, null, 2)
          }]
        };
      } catch (error) {
        handleError(error, "Failed to fetch vault tags");
      }
    }
  );
}
