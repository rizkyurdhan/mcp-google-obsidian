import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { logger } from "../utils/logger.js";
import { generateAuthUrl, exchangeCode } from "../auth/oauth.js";

export async function startHttpTransport(createServer: () => McpServer, port: number) {
    const app = express();

    // Each SSE client gets its own McpServer instance (SDK allows only one transport per server)
    const sessions = new Map<string, { transport: SSEServerTransport; server: McpServer }>();

    app.get("/sse", async (req, res) => {
        logger.info("New SSE connection request.");

        try {
            const server = createServer();

            // Intercept res.write to rewrite the SSE endpoint URL to be absolute
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const originalWrite = res.write.bind(res);
            res.write = (chunk: any, encoding?: any, callback?: any) => {
                let modifiedChunk = chunk;
                if (typeof chunk === 'string' && chunk.includes('event: endpoint\ndata: /message?')) {
                    modifiedChunk = chunk.replace('data: /message?', `data: ${baseUrl}/message?`);
                } else if (Buffer.isBuffer(chunk)) {
                    const str = chunk.toString('utf8');
                    if (str.includes('event: endpoint\ndata: /message?')) {
                        modifiedChunk = Buffer.from(str.replace('data: /message?', `data: ${baseUrl}/message?`), 'utf8');
                    }
                }

                if (typeof encoding === 'function') {
                    return originalWrite(modifiedChunk, encoding);
                } else if (typeof callback === 'function') {
                    return originalWrite(modifiedChunk, encoding, callback);
                } else {
                    return originalWrite(modifiedChunk, encoding);
                }
            };

            const transport = new SSEServerTransport("/message", res);

            // Keepalive ping to prevent connection drops on large idle times or payloads
            const interval = setInterval(() => {
                try {
                    res.write(": keepalive\n\n");
                } catch (err) {
                    clearInterval(interval);
                }
            }, 15000);

            transport.onclose = () => {
                logger.info(`SSE connection closed.`);
                for (const [id, s] of sessions) {
                    if (s.transport === transport) {
                        sessions.delete(id);
                        server.close().catch((e) => logger.error("Server close error:", e));
                        logger.info(`Removed session ${id} from map`);
                    }
                }
                clearInterval(interval);
            };

            await server.connect(transport);

            const sessionId = transport.sessionId;
            if (sessionId) {
                sessions.set(sessionId, { transport, server });
                logger.info(`SSE session ${sessionId} established (${sessions.size} active)`);
            }
        } catch (err: any) {
            logger.error("Failed in GET /sse:", err);
            if (!res.headersSent) {
                res.status(500).send(err.message);
            }
        }
    });

    app.post("/message", async (req, res) => {
        const sessionId = req.query.sessionId as string;

        if (!sessionId) {
            res.status(400).send("sessionId query parameter is required");
            return;
        }

        const session = sessions.get(sessionId);
        if (!session) {
            res.status(404).send(`No active session found for ID: ${sessionId}`);
            return;
        }

        try {
            await session.transport.handlePostMessage(req, res);
        } catch (err: any) {
            logger.error(`Error handling message for session ${sessionId}:`, err);
            if (!res.headersSent) {
                res.status(500).send(err.message);
            }
        }
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
