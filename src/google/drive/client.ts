import { google, drive_v3 } from "googleapis";
import { getAuthClient } from "../../auth/oauth.js";

export async function getDriveClient(): Promise<drive_v3.Drive> {
  const auth = await getAuthClient();
  return google.drive({ version: "v3", auth });
}
