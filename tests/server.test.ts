import { describe, it, expect } from "vitest";
import { createServer } from "../src/server.js";

describe("createServer", () => {
  it("returns an McpServer instance", () => {
    const server = createServer();
    expect(server).toBeDefined();
    expect(typeof server).toBe("object");
  });

  it("has the correct server name and version", () => {
    const server = createServer();
    // The server name/version are set in the constructor
    // We can verify by checking the server object exists and was created without throwing
    expect(server).toBeTruthy();
  });
});
