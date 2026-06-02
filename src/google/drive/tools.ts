import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getDriveClient } from "./client.js";
import { handleError } from "../../utils/errors.js";

export function registerDriveTools(server: McpServer) {
  server.tool(
    "drive_search",
    "Search files and folders",
    {
      query: z.string().describe("The search query (e.g. \"name contains 'meeting'\")"),
      maxResults: z.number().optional().describe("Maximum number of results to return (default: 10)"),
      orderBy: z.string().optional().describe("A comma-separated list of sort keys")
    },
    async ({ query, maxResults, orderBy }) => {
      try {
        const drive = await getDriveClient();
        const res = await drive.files.list({
          q: query,
          pageSize: maxResults || 10,
          orderBy: orderBy,
          fields: "nextPageToken, files(id, name, mimeType, modifiedTime, webViewLink)"
        });
        return {
          content: [{ type: "text", text: JSON.stringify(res.data.files || [], null, 2) }]
        };
      } catch (error) {
        handleError(error, "Failed to search Drive");
      }
    }
  );

  server.tool(
    "drive_get_file",
    "Get file metadata and content",
    {
      fileId: z.string().describe("The ID of the file"),
      includeContent: z.boolean().optional().describe("Whether to download the file content (if applicable)")
    },
    async ({ fileId, includeContent }) => {
      try {
        const drive = await getDriveClient();
        const metadataRes = await drive.files.get({
          fileId: fileId,
          fields: "*"
        });

        const result: any = { metadata: metadataRes.data };

        if (includeContent) {
          // For Google Workspace documents, we need to export them
          const mimeType = metadataRes.data.mimeType || "";
          if (mimeType.startsWith("application/vnd.google-apps.")) {
            // Simplified mapping for export
            let exportMimeType = "text/plain";
            if (mimeType === "application/vnd.google-apps.document") {
              exportMimeType = "text/plain";
            } else if (mimeType === "application/vnd.google-apps.spreadsheet") {
              exportMimeType = "text/csv";
            }

            const exportRes = await drive.files.export({
              fileId: fileId,
              mimeType: exportMimeType
            }, { responseType: 'text' });
            result.content = exportRes.data;
          } else {
            // For binary/regular files
            const contentRes = await drive.files.get({
              fileId: fileId,
              alt: "media"
            }, { responseType: 'text' });
            result.content = contentRes.data;
          }
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      } catch (error) {
        handleError(error, "Failed to get Drive file");
      }
    }
  );

  server.tool(
    "drive_create_file",
    "Create a new file",
    {
      name: z.string().describe("The name of the new file"),
      mimeType: z.string().describe("The MIME type of the file"),
      content: z.string().optional().describe("The textual content of the file"),
      parentId: z.string().optional().describe("The ID of the parent folder")
    },
    async ({ name, mimeType, content, parentId }) => {
      try {
        const drive = await getDriveClient();
        
        const fileMetadata: any = {
          name,
          mimeType
        };
        
        if (parentId) {
          fileMetadata.parents = [parentId];
        }

        const params: any = {
          requestBody: fileMetadata,
          fields: "id, name, webViewLink"
        };

        if (content) {
          params.media = {
            mimeType: mimeType === "application/vnd.google-apps.document" ? "text/plain" : mimeType,
            body: content
          };
        }

        const res = await drive.files.create(params);

        return {
          content: [{ type: "text", text: `File created successfully: ${JSON.stringify(res.data, null, 2)}` }]
        };
      } catch (error) {
        handleError(error, "Failed to create Drive file");
      }
    }
  );

  server.tool(
    "drive_update_file",
    "Update file content or metadata",
    {
      fileId: z.string().describe("The ID of the file"),
      name: z.string().optional().describe("New name for the file"),
      content: z.string().optional().describe("New content for the file"),
      mimeType: z.string().optional().describe("The MIME type for the new content")
    },
    async ({ fileId, name, content, mimeType }) => {
      try {
        const drive = await getDriveClient();
        
        const params: any = {
          fileId,
          requestBody: {}
        };
        
        if (name) params.requestBody.name = name;
        
        if (content) {
          params.media = {
            mimeType: mimeType || "text/plain",
            body: content
          };
        }

        const res = await drive.files.update(params);
        return {
          content: [{ type: "text", text: `File updated successfully: ${JSON.stringify(res.data, null, 2)}` }]
        };
      } catch (error) {
        handleError(error, "Failed to update Drive file");
      }
    }
  );

  server.tool(
    "drive_delete_file",
    "Move a file to trash",
    {
      fileId: z.string().describe("The ID of the file to trash")
    },
    async ({ fileId }) => {
      try {
        const drive = await getDriveClient();
        await drive.files.update({
          fileId,
          requestBody: { trashed: true }
        });
        return {
          content: [{ type: "text", text: `File ${fileId} moved to trash successfully` }]
        };
      } catch (error) {
        handleError(error, "Failed to delete Drive file");
      }
    }
  );

  server.tool(
    "drive_list_folder",
    "List contents of a folder",
    {
      folderId: z.string().optional().describe("The ID of the folder (defaults to root)"),
      maxResults: z.number().optional().describe("Maximum number of results to return (default: 50)")
    },
    async ({ folderId, maxResults }) => {
      try {
        const drive = await getDriveClient();
        const parentId = folderId || "root";
        const query = `'${parentId}' in parents and trashed = false`;
        
        const res = await drive.files.list({
          q: query,
          pageSize: maxResults || 50,
          fields: "nextPageToken, files(id, name, mimeType, modifiedTime, webViewLink)"
        });
        
        return {
          content: [{ type: "text", text: JSON.stringify(res.data.files || [], null, 2) }]
        };
      } catch (error) {
        handleError(error, "Failed to list folder");
      }
    }
  );

  server.tool(
    "drive_share",
    "Set sharing permissions on a file",
    {
      fileId: z.string().describe("The ID of the file"),
      email: z.string().describe("The email address to share with"),
      role: z.enum(["owner", "organizer", "fileOrganizer", "writer", "commenter", "reader"]).describe("The role to grant"),
      type: z.enum(["user", "group", "domain", "anyone"]).describe("The type of grantee")
    },
    async ({ fileId, email, role, type }) => {
      try {
        const drive = await getDriveClient();
        const res = await drive.permissions.create({
          fileId,
          requestBody: {
            type,
            role,
            emailAddress: email
          }
        });
        return {
          content: [{ type: "text", text: `Permission added successfully: ${JSON.stringify(res.data, null, 2)}` }]
        };
      } catch (error) {
        handleError(error, "Failed to share Drive file");
      }
    }
  );

  server.tool(
    "drive_export",
    "Export a Google Workspace file to a different format",
    {
      fileId: z.string().describe("The ID of the file"),
      mimeType: z.string().describe("The target MIME type (e.g. 'application/pdf', 'text/plain')")
    },
    async ({ fileId, mimeType }) => {
      try {
        const drive = await getDriveClient();
        const res = await drive.files.export({
          fileId,
          mimeType
        }, { responseType: 'arraybuffer' });
        
        const base64Data = Buffer.from(res.data as ArrayBuffer).toString('base64');
        return {
          content: [{ type: "text", text: base64Data }]
        };
      } catch (error) {
        handleError(error, "Failed to export Drive file");
      }
    }
  );
}
