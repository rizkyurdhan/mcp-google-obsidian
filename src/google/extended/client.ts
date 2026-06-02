import { google, sheets_v4, slides_v1, tasks_v1, people_v1 } from "googleapis";
import { getAuthClient } from "../../auth/oauth.js";

export async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  const auth = await getAuthClient();
  return google.sheets({ version: "v4", auth });
}

export async function getSlidesClient(): Promise<slides_v1.Slides> {
  const auth = await getAuthClient();
  return google.slides({ version: "v1", auth });
}

export async function getTasksClient(): Promise<tasks_v1.Tasks> {
  const auth = await getAuthClient();
  return google.tasks({ version: "v1", auth });
}

export async function getPeopleClient(): Promise<people_v1.People> {
  const auth = await getAuthClient();
  return google.people({ version: "v1", auth });
}
