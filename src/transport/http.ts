import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { logger } from "../utils/logger.js";
import { generateAuthUrl, exchangeCode } from "../auth/oauth.js";

export async function startHttpTransport(server: McpServer, port: number) {
    const app = express();

    // Use a global or map for active transports
    let transport: SSEServerTransport;

    app.get("/sse", async (req, res) => {
        transport = new SSEServerTransport("/message", res);
        await server.connect(transport);
        logger.info("New SSE connection established.");
    });

    app.post("/message", async (req, res) => {
        if (!transport) {
            res.status(400).send("SSE connection not established");
            return;
        }
        await transport.handlePostMessage(req, res);
    });

    // --- OAuth Routes ---
    app.get("/auth", async (req, res) => {
        try {
            const url = await generateAuthUrl();
            res.redirect(url);
        } catch (error: any) {
            logger.error("Failed to generate auth url", error);
            res.status(500).send(`Auth setup error: ${error.message}`);
        }
    });

    app.get("/callback", async (req, res) => {
        const code = req.query.code as string;
        if (!code) {
            res.status(400).send("No code provided in callback.");
            return;
        }

        try {
            await exchangeCode(code);
            res.send("Authorization successful! Tokens saved. You can close this window and use the MCP tools.");
        } catch (error: any) {
            logger.error("Failed to exchange code", error);
            res.status(500).send(`Error exchanging code: ${error.message}`);
        }
    });

    app.listen(port, () => {
        logger.info(`Starting HTTP server on port ${port}...`);
        logger.info(`To authenticate with Google, visit: http://localhost:${port}/auth`);
    });
}