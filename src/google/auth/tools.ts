import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generateAuthUrl, exchangeCode } from "../../auth/oauth.js";
import { handleError } from "../../utils/errors.js";

export function registerAuthTools(server: McpServer) {
  server.tool(
    "google_auth_get_url",
    "Get the Google OAuth login URL",
    {},
    async () => {
      try {
        const url = await generateAuthUrl();
        return {
          content: [{ type: "text", text: `Please visit this URL to authorize the application:\n${url}\n\nAfter authorizing, extract the 'code' parameter from the redirect URL and use it with google_auth_exchange_code.` }]
        };
      } catch (error) {
        handleError(error, "Failed to generate auth URL");
      }
    }
  );

  server.tool(
    "google_auth_exchange_code",
    "Exchange the OAuth code for credentials",
    {
      code: z.string().describe("The code parameter from the OAuth callback URL")
    },
    async ({ code }) => {
      try {
        await exchangeCode(code);
        return {
          content: [{ type: "text", text: "Successfully authenticated with Google!" }]
        };
      } catch (error) {
        handleError(error, "Failed to exchange auth code");
      }
    }
  );
}
