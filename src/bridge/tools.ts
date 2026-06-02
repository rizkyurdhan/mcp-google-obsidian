import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getVaultAdapter } from "../obsidian/vault/index.js";
import { getDocsClient } from "../google/docs/client.js";
import { cleanObsidianMarkdown } from "./cleaner.js";
import { mergeNotes } from "./merger.js";
import { updateNoteSyncStatus, readSyncState } from "./sync.js";
import { handleError } from "../utils/errors.js";

export function registerBridgeTools(server: McpServer) {
  server.tool(
    "bridge_export_to_docs",
    "Export a single Obsidian note to Google Docs",
    {
      notePath: z.string().describe("Path to the Obsidian note"),
      title: z.string().optional().describe("Title for the new Google Doc")
    },
    async ({ notePath, title }) => {
      try {
        const adapter = await getVaultAdapter();
        const rawContent = await adapter.readNote(notePath);
        const cleanedContent = cleanObsidianMarkdown(rawContent);

        const docs = await getDocsClient();
        const docTitle = title || notePath.split('/').pop()?.replace('.md', '') || "Exported Note";
        
        // Create doc
        const createRes = await docs.documents.create({
          requestBody: { title: docTitle }
        });
        const documentId = createRes.data.documentId!;

        // Append content
        await docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: [
              {
                insertText: {
                  location: { index: 1 },
                  text: cleanedContent
                }
              }
            ]
          }
        });

        // Update sync state
        await updateNoteSyncStatus(notePath, documentId, Date.now());

        return {
          content: [{ type: "text", text: `Exported successfully to Google Docs. Doc ID: ${documentId}\nYou can now add this Doc to NotebookLM.` }]
        };
      } catch (error) {
        handleError(error, "Failed to export note to Docs");
      }
    }
  );

  server.tool(
    "bridge_export_merged_to_docs",
    "Merge multiple Obsidian notes and export as a single Google Doc (ideal for NotebookLM)",
    {
      notePaths: z.array(z.string()).describe("Paths of the Obsidian notes to merge"),
      title: z.string().describe("Title for the merged Google Doc")
    },
    async ({ notePaths, title }) => {
      try {
        const mergedContent = await mergeNotes(notePaths, title);

        const docs = await getDocsClient();
        
        // Create doc
        const createRes = await docs.documents.create({
          requestBody: { title }
        });
        const documentId = createRes.data.documentId!;

        // Append content
        await docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: [
              {
                insertText: {
                  location: { index: 1 },
                  text: mergedContent
                }
              }
            ]
          }
        });

        return {
          content: [{ type: "text", text: `Merged and exported successfully to Google Docs. Doc ID: ${documentId}\nYou can now add this Doc to NotebookLM.` }]
        };
      } catch (error) {
        handleError(error, "Failed to export merged notes");
      }
    }
  );

  server.tool(
    "bridge_get_sync_status",
    "Get the synchronization status of the vault to Google Workspace",
    {},
    async () => {
      try {
        const state = await readSyncState();
        return {
          content: [{ type: "text", text: JSON.stringify(state, null, 2) }]
        };
      } catch (error) {
        handleError(error, "Failed to read sync status");
      }
    }
  );
}
