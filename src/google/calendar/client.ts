import { google, calendar_v3 } from "googleapis";
import { getAuthClient } from "../../auth/oauth.js";

export async function getCalendarClient(): Promise<calendar_v3.Calendar> {
  const auth = await getAuthClient();
  return google.calendar({ version: "v3", auth });
}
