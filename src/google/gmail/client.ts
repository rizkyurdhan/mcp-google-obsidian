import { google, gmail_v1 } from "googleapis";
import { getAuthClient } from "../../auth/oauth.js";

export async function getGmailClient(): Promise<gmail_v1.Gmail> {
  const auth = await getAuthClient();
  return google.gmail({ version: "v1", auth });
}
