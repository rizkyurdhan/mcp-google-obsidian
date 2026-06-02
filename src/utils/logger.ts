
/**
 * A logger that writes only to stderr.
 * Standard output (stdout) is reserved for the MCP protocol in stdio mode.
 */
export const logger = {
  debug: (...args: any[]) => {
    if (process.env.LOG_LEVEL === "debug") {
      console.error("[DEBUG]", ...args);
    }
  },
  info: (...args: any[]) => {
    if (["debug", "info"].includes(process.env.LOG_LEVEL || "info")) {
      console.error("[INFO]", ...args);
    }
  },
  warn: (...args: any[]) => {
    if (["debug", "info", "warn"].includes(process.env.LOG_LEVEL || "info")) {
      console.error("[WARN]", ...args);
    }
  },
  error: (...args: any[]) => {
    console.error("[ERROR]", ...args);
  }
};
