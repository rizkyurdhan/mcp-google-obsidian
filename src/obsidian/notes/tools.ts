import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getVaultAdapter } from "../vault/index.js";
import { handleError } from "../../utils/errors.js";
import { parseMarkdown, stringifyMarkdown } from "../../utils/markdown.js";

export function registerNoteTools(server: McpServer) {
  server.tool(
    "vault_list_notes",
    "List all notes, optionally filtered by folder or tag",
    {
      folder: z.string().optional().describe("Filter by folder path (e.g. 'Projects/MCP')"),
      tag: z.string().optional().describe("Filter by tag (e.g. 'todo')"),
      maxResults: z.number().optional().describe("Maximum number of results to return")
    },
    async ({ folder, tag, maxResults }) => {
      try {
        const adapter = await getVaultAdapter();
        const notes = await adapter.listNotes(folder, tag, maxResults);
        return {
          content: [{ type: "text", text: JSON.stringify(notes, null, 2) }]
        };
      } catch (error) {
        handleError(error, "Failed to list notes");
      }
    }
  );

  server.tool(
    "vault_read_note",
    "Read a note's full content (markdown + frontmatter)",
    {
      path: z.string().describe("The path to the note (e.g. 'Inbox/Idea.md')")
    },
    async ({ path }) => {
      try {
        const adapter = await getVaultAdapter();
        const content = await adapter.readNote(path);
        return {
          content: [{ type: "text", text: content }]
        };
      } catch (error) {
        handleError(error, "Failed to read note");
      }
    }
  );

  server.tool(
    "vault_create_note",
    "Create a new note",
    {
      path: z.string().describe("The path where the note should be created"),
      content: z.string().describe("The markdown content of the note"),
      frontmatter: z.record(z.any()).optional().describe("Optional frontmatter properties as JSON")
    },
    async ({ path, content, frontmatter }) => {
      try {
        const adapter = await getVaultAdapter();
        const fullContent = frontmatter ? stringifyMarkdown(content, frontmatter) : content;
        await adapter.createNote(path, fullContent);
        return {
          content: [{ type: "text", text: `Note created successfully at ${path}` }]
        };
      } catch (error) {
        handleError(error, "Failed to create note");
      }
    }
  );

  server.tool(
    "vault_update_note",
    "Overwrite or patch a note's content",
    {
      path: z.string().describe("The path to the note"),
      content: z.string().describe("The content to apply"),
      mode: z.enum(["overwrite", "append", "prepend", "patch"]).describe("How to apply the content")
    },
    async ({ path, content, mode }) => {
      try {
        const adapter = await getVaultAdapter();
        await adapter.updateNote(path, content, mode);
        return {
          content: [{ type: "text", text: `Note updated successfully with mode ${mode}` }]
        };
      } catch (error) {
        handleError(error, "Failed to update note");
      }
    }
  );

  server.tool(
    "vault_delete_note",
    "Delete a note",
    {
      path: z.string().describe("The path to the note to delete")
    },
    async ({ path }) => {
      try {
        const adapter = await getVaultAdapter();
        await adapter.deleteNote(path);
        return {
          content: [{ type: "text", text: `Note deleted successfully` }]
        };
      } catch (error) {
        handleError(error, "Failed to delete note");
      }
    }
  );
}
