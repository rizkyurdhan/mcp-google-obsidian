import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import http from "http";

async function run() {
    const server = new McpServer({ name: "test", version: "1.0" });
    
    // Mock response
    const req1 = { headers: {} };
    const res1 = new http.ServerResponse(req1);
    res1.writeHead = () => {};
    res1.write = (chunk) => { console.log("Write 1:", chunk); return true; };
    
    const transport1 = new SSEServerTransport("/message", res1);
    await server.connect(transport1);
    await server.close();
    
    const req2 = { headers: {} };
    const res2 = new http.ServerResponse(req2);
    res2.writeHead = () => {};
    res2.write = (chunk) => { console.log("Write 2:", chunk); return true; };
    
    const transport2 = new SSEServerTransport("/message", res2);
    await server.connect(transport2);
    console.log("Can we send?");
    try {
        await server.server.sendLoggingMessage({ level: "info", data: "test" });
        console.log("Sent successfully");
    } catch(err) {
        console.error("Send failed:", err.message);
    }
}
run();
