import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGmailClient } from "./gmail/client.js";
import { getDriveClient } from "./drive/client.js";
import { getCalendarClient } from "./calendar/client.js";
import { handleError } from "../utils/errors.js";

export function registerGoogleResources(server: McpServer) {
  server.resource(
    "workspace-gmail-labels",
    "workspace://gmail/labels",
    async (uri) => {
      try {
        const gmail = await getGmailClient();
        const res = await gmail.users.labels.list({ userId: "me" });
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(res.data.labels || [], null, 2)
          }]
        };
      } catch (error) {
        handleError(error, "Failed to fetch Gmail labels resource");
      }
    }
  );

  server.resource(
    "workspace-drive-recent",
    "workspace://drive/recent",
    async (uri) => {
      try {
        const drive = await getDriveClient();
        const res = await drive.files.list({
          q: "trashed = false",
          orderBy: "modifiedTime desc",
          pageSize: 10,
          fields: "files(id, name, mimeType, modifiedTime, webViewLink)"
        });
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(res.data.files || [], null, 2)
          }]
        };
      } catch (error) {
        handleError(error, "Failed to fetch Drive recent resource");
      }
    }
  );

  server.resource(
    "workspace-calendar-today",
    "workspace://calendar/today",
    async (uri) => {
      try {
        const calendar = await getCalendarClient();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const res = await calendar.events.list({
          calendarId: "primary",
          timeMin: startOfDay.toISOString(),
          timeMax: endOfDay.toISOString(),
          singleEvents: true,
          orderBy: "startTime"
        });

        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(res.data.items || [], null, 2)
          }]
        };
      } catch (error) {
        handleError(error, "Failed to fetch Calendar today resource");
      }
    }
  );
}
