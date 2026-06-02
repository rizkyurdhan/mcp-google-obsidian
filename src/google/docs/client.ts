import { google, docs_v1 } from "googleapis";
import { getAuthClient } from "../../auth/oauth.js";

export async function getDocsClient(): Promise<docs_v1.Docs> {
  const auth = await getAuthClient();
  return google.docs({ version: "v1", auth });
}
