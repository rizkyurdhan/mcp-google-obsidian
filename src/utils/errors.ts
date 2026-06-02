import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

/**
 * Creates an McpError with the INVALID_PARAMS error code.
 */
export function createInvalidParamsError(message: string): McpError {
  return new McpError(ErrorCode.InvalidParams, message);
}

/**
 * Creates an McpError with the INTERNAL_ERROR error code.
 */
export function createInternalError(message: string): McpError {
  return new McpError(ErrorCode.InternalError, message);
}

/**
 * Ensures an error caught in a try/catch is thrown as an McpError.
 */
export function handleError(error: unknown, fallbackMessage: string = "An unexpected error occurred"): never {
  if (error instanceof McpError) {
    throw error;
  }
  if (error instanceof Error) {
    throw createInternalError(`${fallbackMessage}: ${error.message}`);
  }
  throw createInternalError(fallbackMessage);
}
