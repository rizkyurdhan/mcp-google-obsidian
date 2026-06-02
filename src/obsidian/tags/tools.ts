import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getVaultAdapter } from "../vault/index.js";
import { handleError } from "../../utils/errors.js";
import { parseMarkdown, stringifyMarkdown } from "../../utils/markdown.js";

export function registerTagTools(server: McpServer) {
  server.tool(
    "vault_list_tags",
    "List all tags in the vault with counts",
    {},
    async () => {
      try {
        const adapter = await getVaultAdapter();
        const tags = await adapter.listTags();
        return {
          content: [{ type: "text", text: JSON.stringify(tags, null, 2) }]
        };
      } catch (error) {
        handleError(error, "Failed to list tags");
      }
    }
  );

  server.tool(
    "vault_get_frontmatter",
    "Get parsed frontmatter of a note",
    {
      path: z.string().describe("The path to the note")
    },
    async ({ path }) => {
      try {
        const adapter = await getVaultAdapter();
        const content = await adapter.readNote(path);
        const parsed = parseMarkdown(content);
        return {
          content: [{ type: "text", text: JSON.stringify(parsed.frontmatter, null, 2) }]
        };
      } catch (error) {
        handleError(error, "Failed to get frontmatter");
      }
    }
  );

  server.tool(
    "vault_update_frontmatter",
    "Update frontmatter fields (merges with existing)",
    {
      path: z.string().describe("The path to the note"),
      fields: z.record(z.any()).describe("Key-value object of fields to update or add")
    },
    async ({ path, fields }) => {
      try {
        const adapter = await getVaultAdapter();
        const content = await adapter.readNote(path);
        const parsed = parseMarkdown(content);
        
        const newFrontmatter = { ...parsed.frontmatter, ...fields };
        const newContent = stringifyMarkdown(parsed.content, newFrontmatter);
        
        await adapter.updateNote(path, newContent, "overwrite");
        return {
          content: [{ type: "text", text: `Frontmatter updated successfully` }]
        };
      } catch (error) {
        handleError(error, "Failed to update frontmatter");
      }
    }
  );
}
