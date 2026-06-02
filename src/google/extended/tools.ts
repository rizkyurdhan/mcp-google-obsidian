import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { logger } from "../../utils/logger.js";
import { getSheetsClient, getSlidesClient, getTasksClient, getPeopleClient } from "./client.js";
import { handleError } from "../../utils/errors.js";

// Placeholders for remaining Google APIs to complete the 70 tools scope

export function registerExtendedGoogleTools(server: McpServer) {
  // --- Google Sheets (7 tools) ---
  server.tool("sheets_create", "Create a Google Sheet", { title: z.string() }, async ({ title }) => {
    try {
      const sheets = await getSheetsClient();
      const res = await sheets.spreadsheets.create({ requestBody: { properties: { title } } });
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    } catch (error) {
      handleError(error, "Failed to create Google Sheet");
    }
  });
  server.tool("sheets_get", "Get a Google Sheet", { spreadsheetId: z.string() }, async ({ spreadsheetId }) => {
    try {
      const sheets = await getSheetsClient();
      const res = await sheets.spreadsheets.get({ spreadsheetId });
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    } catch (error) {
      handleError(error, "Failed to get Google Sheet");
    }
  });

  server.tool("sheets_read_range", "Read a range of cells", { spreadsheetId: z.string(), range: z.string() }, async ({ spreadsheetId, range }) => {
    try {
      const sheets = await getSheetsClient();
      const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    } catch (error) {
      handleError(error, "Failed to read Google Sheet range");
    }
  });
  server.tool("sheets_write_range", "Write to a range of cells", { spreadsheetId: z.string(), range: z.string(), values: z.array(z.array(z.any())) }, async ({ spreadsheetId, range, values }) => {
    try {
      const sheets = await getSheetsClient();
      const res = await sheets.spreadsheets.values.update({ spreadsheetId, range, valueInputOption: "USER_ENTERED", requestBody: { values } });
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    } catch (error) {
      handleError(error, "Failed to write range");
    }
  });
  server.tool("sheets_append", "Append rows to a sheet", { spreadsheetId: z.string(), range: z.string(), values: z.array(z.array(z.any())) }, async ({ spreadsheetId, range, values }) => {
    try {
      const sheets = await getSheetsClient();
      const res = await sheets.spreadsheets.values.append({ spreadsheetId, range, valueInputOption: "USER_ENTERED", requestBody: { values } });
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    } catch (error) {
      handleError(error, "Failed to append rows");
    }
  });
  server.tool("sheets_clear", "Clear a range of cells", { spreadsheetId: z.string(), range: z.string() }, async ({ spreadsheetId, range }) => {
    try {
      const sheets = await getSheetsClient();
      const res = await sheets.spreadsheets.values.clear({ spreadsheetId, range });
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    } catch (error) {
      handleError(error, "Failed to clear range");
    }
  });
  server.tool("sheets_add_sheet", "Add a new sheet tab", { spreadsheetId: z.string(), title: z.string() }, async ({ spreadsheetId, title }) => {
    try {
      const sheets = await getSheetsClient();
      const res = await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ addSheet: { properties: { title } } }] } });
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    } catch (error) {
      handleError(error, "Failed to add sheet");
    }
  });

  // --- Google Slides (5 tools) ---
  server.tool("slides_create", "Create a Google Slide", { title: z.string() }, async ({ title }) => {
    try {
      const slides = await getSlidesClient();
      const res = await slides.presentations.create({ requestBody: { title } });
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    } catch (error) {
      handleError(error, "Failed to create Google Slide");
    }
  });

  server.tool("slides_get", "Get a Google Slide", { presentationId: z.string() }, async ({ presentationId }) => {
    try {
      const slides = await getSlidesClient();
      const res = await slides.presentations.get({ presentationId });
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    } catch (error) {
      handleError(error, "Failed to get Google Slide");
    }
  });

  server.tool("slides_add_slide", "Add a slide", { presentationId: z.string() }, async ({ presentationId }) => {
    try {
      const slides = await getSlidesClient();
      const res = await slides.presentations.batchUpdate({ presentationId, requestBody: { requests: [{ createSlide: {} }] } });
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    } catch (error) {
      handleError(error, "Failed to add slide");
    }
  });

  server.tool("slides_add_text", "Add text to slide", { presentationId: z.string(), pageObjectId: z.string(), text: z.string() }, async ({ presentationId, pageObjectId, text }) => {
    try {
      const slides = await getSlidesClient();
      const res = await slides.presentations.batchUpdate({ presentationId, requestBody: { requests: [{ insertText: { objectId: pageObjectId, text } }] } });
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    } catch (error) {
      handleError(error, "Failed to add text to slide");
    }
  });

  server.tool("slides_replace_all_text", "Replace text across presentation", { presentationId: z.string(), find: z.string(), replace: z.string() }, async ({ presentationId, find, replace }) => {
    try {
      const slides = await getSlidesClient();
      const res = await slides.presentations.batchUpdate({ presentationId, requestBody: { requests: [{ replaceAllText: { containsText: { text: find }, replaceText: replace } }] } });
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    } catch (error) {
      handleError(error, "Failed to replace text");
    }
  });

  // --- Google Tasks (5 tools) ---
  server.tool("tasks_list_tasklists", "List task lists", {}, async () => {
    try {
      const tasks = await getTasksClient();
      const res = await tasks.tasklists.list();
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    } catch (error) {
      handleError(error, "Failed to list tasklists");
    }
  });

  server.tool("tasks_list_tasks", "List tasks in a list", { tasklistId: z.string() }, async ({ tasklistId }) => {
    try {
      const tasks = await getTasksClient();
      const res = await tasks.tasks.list({ tasklistId });
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    } catch (error) {
      handleError(error, "Failed to list tasks");
    }
  });

  server.tool("tasks_create_task", "Create a task", { tasklistId: z.string(), title: z.string() }, async ({ tasklistId, title }) => {
    try {
      const tasks = await getTasksClient();
      const res = await tasks.tasks.insert({ tasklistId, requestBody: { title } });
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    } catch (error) {
      handleError(error, "Failed to create task");
    }
  });

  server.tool("tasks_update_task", "Update a task", { tasklistId: z.string(), taskId: z.string(), title: z.string().optional() }, async ({ tasklistId, taskId, title }) => {
    try {
      const tasks = await getTasksClient();
      const res = await tasks.tasks.patch({ tasklistId, task: taskId, requestBody: { title } });
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    } catch (error) {
      handleError(error, "Failed to update task");
    }
  });

  server.tool("tasks_delete_task", "Delete a task", { tasklistId: z.string(), taskId: z.string() }, async ({ tasklistId, taskId }) => {
    try {
      const tasks = await getTasksClient();
      const res = await tasks.tasks.delete({ tasklistId, task: taskId });
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    } catch (error) {
      handleError(error, "Failed to delete task");
    }
  });

  // --- Google Contacts (4 tools) ---
  server.tool("contacts_list", "List contacts", {}, async () => {
    try {
      const people = await getPeopleClient();
      const res = await people.people.connections.list({ resourceName: "people/me", personFields: "names,emailAddresses" });
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    } catch (error) {
      handleError(error, "Failed to list contacts");
    }
  });

  server.tool("contacts_get", "Get contact", { resourceName: z.string() }, async ({ resourceName }) => {
    try {
      const people = await getPeopleClient();
      const res = await people.people.get({ resourceName, personFields: "names,emailAddresses" });
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    } catch (error) {
      handleError(error, "Failed to get contact");
    }
  });

  server.tool("contacts_create", "Create contact", { name: z.string(), email: z.string() }, async ({ name, email }) => {
    try {
      const people = await getPeopleClient();
      const res = await people.people.createContact({ requestBody: { names: [{ givenName: name }], emailAddresses: [{ value: email }] } });
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    } catch (error) {
      handleError(error, "Failed to create contact");
    }
  });

  server.tool("contacts_search", "Search contacts", { query: z.string() }, async ({ query }) => {
    try {
      const people = await getPeopleClient();
      const res = await people.people.searchContacts({ query, readMask: "names,emailAddresses" });
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    } catch (error) {
      handleError(error, "Failed to search contacts");
    }
  });
}
