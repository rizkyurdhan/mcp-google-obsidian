import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getVaultAdapter } from "../vault/index.js";
import { handleError } from "../../utils/errors.js";

export function registerGraphTools(server: McpServer) {
  server.tool(
    "vault_get_backlinks",
    "Get all notes that link to a given note",
    {
      path: z.string().describe("The path to the note")
    },
    async ({ path }) => {
      try {
        const adapter = await getVaultAdapter();
        const backlinks = await adapter.getBacklinks(path);
        return {
          content: [{ type: "text", text: JSON.stringify(backlinks, null, 2) }]
        };
      } catch (error) {
        handleError(error, "Failed to get backlinks");
      }
    }
  );

  server.tool(
    "vault_get_outlinks",
    "Get all notes that a given note links to",
    {
      path: z.string().describe("The path to the note")
    },
    async ({ path }) => {
      try {
        const adapter = await getVaultAdapter();
        const outlinks = await adapter.getOutlinks(path);
        return {
          content: [{ type: "text", text: JSON.stringify(outlinks, null, 2) }]
        };
      } catch (error) {
        handleError(error, "Failed to get outlinks");
      }
    }
  );
}
