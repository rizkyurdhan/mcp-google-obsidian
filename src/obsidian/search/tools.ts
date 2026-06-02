import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getVaultAdapter } from "../vault/index.js";
import { handleError } from "../../utils/errors.js";

export function registerSearchTools(server: McpServer) {
  server.tool(
    "vault_search",
    "Full-text search across the vault",
    {
      query: z.string().describe("The text to search for"),
      maxResults: z.number().optional().describe("Maximum number of results to return")
    },
    async ({ query, maxResults }) => {
      try {
        const adapter = await getVaultAdapter();
        const results = await adapter.search(query, maxResults);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
        };
      } catch (error) {
        handleError(error, "Failed to search vault");
      }
    }
  );

  server.tool(
    "vault_search_by_tag",
    "Find notes with specific tags",
    {
      tags: z.array(z.string()).describe("List of tags (without #)"),
      matchAll: z.boolean().optional().describe("If true, notes must have ALL tags. If false, ANY tag matches (default: false)")
    },
    async ({ tags, matchAll }) => {
      try {
        const adapter = await getVaultAdapter();
        const results = await adapter.searchByTag(tags, matchAll);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
        };
      } catch (error) {
        handleError(error, "Failed to search vault by tag");
      }
    }
  );
}
