import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { getAllScopes } from "./scopes.js";
import { logger } from "../utils/logger.js";

const TOKEN_PATH = process.env.TOKEN_STORAGE_PATH 
  ? process.env.TOKEN_STORAGE_PATH.replace(/^~(?=$|\/|\\)/, os.homedir())
  : path.join(os.homedir(), ".mcp-suite", "google-tokens.json");

let oauth2Client: OAuth2Client | null = null;

export async function getAuthClient(): Promise<OAuth2Client> {
  if (oauth2Client) {
    return oauth2Client;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/callback";

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment.");
  }

  oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  try {
    const tokens = await loadTokens();
    if (tokens) {
      oauth2Client.setCredentials(tokens);
    }
  } catch (e) {
    logger.warn("No existing tokens found or failed to load. Authentication may be required.");
  }

  oauth2Client.on("tokens", (tokens) => {
    logger.info("New tokens received, saving...");
    saveTokens(tokens).catch((err) => {
      logger.error("Failed to save tokens:", err);
    });
  });

  return oauth2Client;
}

async function loadTokens(): Promise<any> {
  try {
    const data = await fs.readFile(TOKEN_PATH, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

async function saveTokens(tokens: any): Promise<void> {
  try {
    const dir = path.dirname(TOKEN_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2), "utf-8");
  } catch (e) {
    logger.error("Error saving tokens:", e);
    throw e;
  }
}

export async function generateAuthUrl(): Promise<string> {
  const client = await getAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: getAllScopes(),
    prompt: "consent"
  });
}

export async function exchangeCode(code: string): Promise<void> {
  const client = await getAuthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  await saveTokens(tokens);
}
