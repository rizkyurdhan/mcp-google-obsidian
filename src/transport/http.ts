import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { logger } from "../utils/logger.js";
import { generateAuthUrl, exchangeCode } from "../auth/oauth.js";

export async function startHttpTransport(server: McpServer, port: number) {
    const app = express();

    // Map of active session ID to transport
    const transports = new Map<string, SSEServerTransport>();

    app.get("/sse", async (req, res) => {
        logger.info("New SSE connection request.");

        try {
            // Close previous session — McpServer only supports one transport at a time
            for (const [id, old] of transports) {
                logger.info(`Closing old transport ${id}`);
                await old.close().catch((e) => logger.error("Old transport close error:", e));
                transports.delete(id);
            }
            logger.info("Closing server...");
            await server.close().catch((e) => logger.error("Server close error:", e));
            logger.info("Server closed.");

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

            // Set onclose BEFORE server.connect(), so Protocol captures it and calls it properly
            transport.onclose = () => {
                logger.info(`SSE connection closed.`);
                // We'll clean up the map based on the active transport instance
                for (const [id, t] of transports) {
                    if (t === transport) {
                        transports.delete(id);
                        logger.info(`Removed session ${id} from map`);
                    }
                }
                clearInterval(interval);
            };

            logger.info("Connecting new transport...");
            await server.connect(transport);
            logger.info("Transport connected!");

            // Wait for the transport to initialize and generate a sessionId
            const sessionId = transport.sessionId;
            if (sessionId) {
                transports.set(sessionId, transport);
                logger.info(`SSE connection established for session: ${sessionId}`);
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

        const transport = transports.get(sessionId);
        if (!transport) {
            res.status(404).send(`No active session found for ID: ${sessionId}`);
            return;
        }

        try {
            await transport.handlePostMessage(req, res);
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
