import { describe, it, expect } from "vitest";
import {
  createInvalidParamsError,
  createInternalError,
  handleError,
} from "../src/utils/errors.js";

describe("createInvalidParamsError", () => {
  it("creates an error with the correct message", () => {
    const err = createInvalidParamsError("bad param");
    expect(err.message).toContain("bad param");
  });

  it("creates an error with code -32602 (InvalidParams)", () => {
    const err = createInvalidParamsError("test");
    expect(err.code).toBe(-32602);
  });
});

describe("createInternalError", () => {
  it("creates an error with the correct message", () => {
    const err = createInternalError("something broke");
    expect(err.message).toContain("something broke");
  });

  it("creates an error with code -32603 (InternalError)", () => {
    const err = createInternalError("test");
    expect(err.code).toBe(-32603);
  });
});

describe("handleError", () => {
  it("re-throws McpError instances directly", () => {
    const mcpErr = createInternalError("original");
    expect(() => handleError(mcpErr)).toThrow(mcpErr);
  });

  it("wraps standard Error with fallback message prefix", () => {
    const stdErr = new Error("file not found");
    expect(() => handleError(stdErr, "Read failed")).toThrow(
      "Read failed: file not found"
    );
  });

  it("wraps unknown non-Error values with fallback message", () => {
    expect(() => handleError("string error", "Something went wrong")).toThrow(
      "Something went wrong"
    );
  });

  it("uses default fallback when none provided", () => {
    expect(() => handleError(42)).toThrow("An unexpected error occurred");
  });
});
