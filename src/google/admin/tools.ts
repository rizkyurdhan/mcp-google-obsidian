import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerAdminTools(server: McpServer) {
  server.tool("admin_list_users", "List domain users", {}, async () => ({ content: [{ type: "text", text: "Admin tools require Domain-Wide Delegation and Service Accounts. Not fully implemented in POC." }] }));
  server.tool("admin_get_user", "Get user details", { userKey: z.string() }, async () => ({ content: [{ type: "text", text: "Not implemented" }] }));
  server.tool("admin_create_user", "Create a new user", { primaryEmail: z.string(), name: z.string() }, async () => ({ content: [{ type: "text", text: "Not implemented" }] }));
  server.tool("admin_suspend_user", "Suspend a user", { userKey: z.string() }, async () => ({ content: [{ type: "text", text: "Not implemented" }] }));
  server.tool("admin_list_groups", "List domain groups", {}, async () => ({ content: [{ type: "text", text: "Not implemented" }] }));
  server.tool("admin_group_members", "List group members", { groupKey: z.string() }, async () => ({ content: [{ type: "text", text: "Not implemented" }] }));
}
