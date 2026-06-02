import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getDocsClient } from "./client.js";
import { handleError } from "../../utils/errors.js";

export function registerDocsTools(server: McpServer) {
  server.tool(
    "docs_get",
    "Get the full content of a Google Doc",
    {
      documentId: z.string().describe("The ID of the document")
    },
    async ({ documentId }) => {
      try {
        const docs = await getDocsClient();
        const res = await docs.documents.get({
          documentId
        });
        return {
          content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }]
        };
      } catch (error) {
        handleError(error, "Failed to get Google Doc");
      }
    }
  );

  server.tool(
    "docs_create",
    "Create a new Google Doc",
    {
      title: z.string().describe("The title of the new document"),
      content: z.string().optional().describe("Optional initial text content to append to the document")
    },
    async ({ title, content }) => {
      try {
        const docs = await getDocsClient();
        
        // Create the empty doc first
        const createRes = await docs.documents.create({
          requestBody: {
            title
          }
        });
        const documentId = createRes.data.documentId!;

        // If initial content provided, append it
        if (content) {
          await docs.documents.batchUpdate({
            documentId,
            requestBody: {
              requests: [
                {
                  insertText: {
                    location: {
                      index: 1 // Start of document
                    },
                    text: content
                  }
                }
              ]
            }
          });
        }

        return {
          content: [{ type: "text", text: `Document created successfully. ID: ${documentId}` }]
        };
      } catch (error) {
        handleError(error, "Failed to create Google Doc");
      }
    }
  );

  server.tool(
    "docs_append",
    "Append text to the end of a document",
    {
      documentId: z.string().describe("The ID of the document"),
      text: z.string().describe("The text to append")
    },
    async ({ documentId, text }) => {
      try {
        const docs = await getDocsClient();
        
        // Need to get the document to find its end index
        const docRes = await docs.documents.get({ documentId });
        const content = docRes.data.body?.content;
        const lastElement = content ? content[content.length - 1] : null;
        let endIndex = 1;
        
        if (lastElement && lastElement.endIndex) {
          // Append right before the final newline
          endIndex = lastElement.endIndex - 1;
        }

        const res = await docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: [
              {
                insertText: {
                  location: {
                    index: endIndex
                  },
                  text: text
                }
              }
            ]
          }
        });

        return {
          content: [{ type: "text", text: `Text appended successfully` }]
        };
      } catch (error) {
        handleError(error, "Failed to append to Google Doc");
      }
    }
  );

  server.tool(
    "docs_batch_update",
    "Apply structured edits (insert, delete, format) to a document",
    {
      documentId: z.string().describe("The ID of the document"),
      requests: z.array(z.any()).describe("Array of Google Docs API Request objects")
    },
    async ({ documentId, requests }) => {
      try {
        const docs = await getDocsClient();
        const res = await docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests
          }
        });
        return {
          content: [{ type: "text", text: `Batch update successful: ${JSON.stringify(res.data, null, 2)}` }]
        };
      } catch (error) {
        handleError(error, "Failed to perform batch update on Google Doc");
      }
    }
  );

  server.tool(
    "docs_find_replace",
    "Find and replace text in a document",
    {
      documentId: z.string().describe("The ID of the document"),
      find: z.string().describe("The text to find"),
      replace: z.string().describe("The text to replace it with"),
      matchCase: z.boolean().optional().describe("Whether to match case (default: false)")
    },
    async ({ documentId, find, replace, matchCase }) => {
      try {
        const docs = await getDocsClient();
        const res = await docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: [
              {
                replaceAllText: {
                  containsText: {
                    text: find,
                    matchCase: matchCase || false
                  },
                  replaceText: replace
                }
              }
            ]
          }
        });
        return {
          content: [{ type: "text", text: `Find/replace successful. Occurrences changed: ${res.data.replies?.[0]?.replaceAllText?.occurrencesChanged || 0}` }]
        };
      } catch (error) {
        handleError(error, "Failed to find/replace in Google Doc");
      }
    }
  );
}
