import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCalendarClient } from "./client.js";
import { handleError } from "../../utils/errors.js";

export function registerCalendarTools(server: McpServer) {
  server.tool(
    "calendar_list",
    "List the user's calendars",
    {},
    async () => {
      try {
        const calendar = await getCalendarClient();
        const res = await calendar.calendarList.list();
        return {
          content: [{ type: "text", text: JSON.stringify(res.data.items || [], null, 2) }]
        };
      } catch (error) {
        handleError(error, "Failed to list calendars");
      }
    }
  );

  server.tool(
    "calendar_events_list",
    "List events in a time range",
    {
      calendarId: z.string().optional().describe("The ID of the calendar (default: 'primary')"),
      timeMin: z.string().describe("Lower bound for an event's end time (RFC3339 timestamp)"),
      timeMax: z.string().describe("Upper bound for an event's start time (RFC3339 timestamp)"),
      maxResults: z.number().optional().describe("Maximum number of results to return (default: 50)")
    },
    async ({ calendarId, timeMin, timeMax, maxResults }) => {
      try {
        const calendar = await getCalendarClient();
        const res = await calendar.events.list({
          calendarId: calendarId || "primary",
          timeMin,
          timeMax,
          maxResults: maxResults || 50,
          singleEvents: true,
          orderBy: "startTime"
        });
        return {
          content: [{ type: "text", text: JSON.stringify(res.data.items || [], null, 2) }]
        };
      } catch (error) {
        handleError(error, "Failed to list calendar events");
      }
    }
  );

  server.tool(
    "calendar_event_get",
    "Get details of a specific event",
    {
      calendarId: z.string().optional().describe("The ID of the calendar (default: 'primary')"),
      eventId: z.string().describe("The ID of the event")
    },
    async ({ calendarId, eventId }) => {
      try {
        const calendar = await getCalendarClient();
        const res = await calendar.events.get({
          calendarId: calendarId || "primary",
          eventId
        });
        return {
          content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }]
        };
      } catch (error) {
        handleError(error, "Failed to get calendar event");
      }
    }
  );

  server.tool(
    "calendar_event_create",
    "Create a calendar event",
    {
      calendarId: z.string().optional().describe("The ID of the calendar (default: 'primary')"),
      summary: z.string().describe("The summary/title of the event"),
      start: z.string().describe("Start time (RFC3339 timestamp)"),
      end: z.string().describe("End time (RFC3339 timestamp)"),
      description: z.string().optional().describe("Event description"),
      attendees: z.array(z.string()).optional().describe("List of attendee email addresses"),
      location: z.string().optional().describe("Event location")
    },
    async ({ calendarId, summary, start, end, description, attendees, location }) => {
      try {
        const calendar = await getCalendarClient();
        const eventBody: any = {
          summary,
          start: { dateTime: start },
          end: { dateTime: end },
          description,
          location
        };

        if (attendees && attendees.length > 0) {
          eventBody.attendees = attendees.map(email => ({ email }));
        }

        const res = await calendar.events.insert({
          calendarId: calendarId || "primary",
          requestBody: eventBody,
          sendUpdates: attendees && attendees.length > 0 ? "all" : "none"
        });

        return {
          content: [{ type: "text", text: `Event created successfully: ${res.data.htmlLink}` }]
        };
      } catch (error) {
        handleError(error, "Failed to create calendar event");
      }
    }
  );

  server.tool(
    "calendar_event_update",
    "Update an existing event",
    {
      calendarId: z.string().optional().describe("The ID of the calendar (default: 'primary')"),
      eventId: z.string().describe("The ID of the event"),
      summary: z.string().optional().describe("The summary/title of the event"),
      start: z.string().optional().describe("Start time (RFC3339 timestamp)"),
      end: z.string().optional().describe("End time (RFC3339 timestamp)"),
      description: z.string().optional().describe("Event description")
    },
    async ({ calendarId, eventId, summary, start, end, description }) => {
      try {
        const calendar = await getCalendarClient();
        
        // Fetch existing event first
        const existingRes = await calendar.events.get({
          calendarId: calendarId || "primary",
          eventId
        });
        const event = existingRes.data;

        if (summary) event.summary = summary;
        if (description) event.description = description;
        if (start) event.start = { dateTime: start };
        if (end) event.end = { dateTime: end };

        const res = await calendar.events.update({
          calendarId: calendarId || "primary",
          eventId,
          requestBody: event
        });

        return {
          content: [{ type: "text", text: `Event updated successfully: ${res.data.htmlLink}` }]
        };
      } catch (error) {
        handleError(error, "Failed to update calendar event");
      }
    }
  );

  server.tool(
    "calendar_event_delete",
    "Delete a calendar event",
    {
      calendarId: z.string().optional().describe("The ID of the calendar (default: 'primary')"),
      eventId: z.string().describe("The ID of the event to delete")
    },
    async ({ calendarId, eventId }) => {
      try {
        const calendar = await getCalendarClient();
        await calendar.events.delete({
          calendarId: calendarId || "primary",
          eventId
        });
        return {
          content: [{ type: "text", text: `Event deleted successfully` }]
        };
      } catch (error) {
        handleError(error, "Failed to delete calendar event");
      }
    }
  );
}
