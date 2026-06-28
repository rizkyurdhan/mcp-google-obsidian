import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import http from "http";

async function run() {
    const server = new McpServer({ name: "test", version: "1.0" });
    
    // Mock response
    const res1 = new http.ServerResponse({} /* dummy request */);
    res1.writeHead = () => {};
    res1.write = () => true;
    
    const transport1 = new SSEServerTransport("/message", res1);
    await server.connect(transport1);
    console.log("Connected 1");
    
    await server.close();
    console.log("Closed 1");
    
    const res2 = new http.ServerResponse({} /* dummy request */);
    res2.writeHead = () => {};
    res2.write = () => true;
    
    const transport2 = new SSEServerTransport("/message", res2);
    try {
        await server.connect(transport2);
        console.log("Connected 2!");
    } catch (err) {
        console.error("Failed 2:", err.message);
    }
}
run();
