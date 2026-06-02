import { VaultAdapter } from "./adapter.js";
import { FileSystemAdapter } from "./fs-adapter.js";
import { RestApiAdapter } from "./rest-adapter.js";
import { logger } from "../../utils/logger.js";
import { Agent } from "undici";

const insecureAgent = new Agent({ connect: { rejectUnauthorized: false } });

let adapterInstance: VaultAdapter | null = null;

export async function getVaultAdapter(): Promise<VaultAdapter> {
  if (adapterInstance) return adapterInstance;

  const vaultPath = process.env.OBSIDIAN_VAULT_PATH;
  if (!vaultPath) {
    throw new Error("OBSIDIAN_VAULT_PATH is not set in environment.");
  }

  const restUrl = process.env.OBSIDIAN_REST_API_URL || "https://localhost:27124";
  const apiKey = process.env.OBSIDIAN_REST_API_KEY;

  // Try REST API first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const headers: any = { Accept: "application/json" };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const res = await fetch(`${restUrl}/`, { 
      headers,
      signal: controller.signal,
      dispatcher: insecureAgent
    } as any);
    
    clearTimeout(timeoutId);
    
    if (res.ok) {
      logger.info(`Connected to Obsidian Local REST API at ${restUrl}`);
      adapterInstance = new RestApiAdapter(restUrl, apiKey);
      return adapterInstance;
    }
  } catch (error) {
    logger.debug("Local REST API not reachable, falling back to FileSystemAdapter");
  }

  // Fallback to FileSystem
  logger.info(`Using FileSystemAdapter for vault at ${vaultPath}`);
  adapterInstance = new FileSystemAdapter(vaultPath);
  return adapterInstance;
}
