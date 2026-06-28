import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";

const server = new McpServer({ name: "test", version: "1.0" });
const app = express();
const transports = new Map();

app.get("/sse", async (req, res) => {
    try {
        console.log("Closing old...", transports.size);
        for (const [id, old] of transports) {
            await old.close().catch(e => console.error(e));
            transports.delete(id);
        }
        await server.close().catch(e => console.error(e));

        const transport = new SSEServerTransport("/message", res);
        await server.connect(transport);
        transports.set(transport.sessionId, transport);
        console.log("Connected!", transport.sessionId);
    } catch(err) {
        console.error("FAIL:", err.message);
        if (!res.headersSent) res.status(500).send(err.message);
    }
});

app.listen(3010, () => console.log("Listening on 3010"));
