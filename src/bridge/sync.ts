import * as fs from "fs/promises";
import * as path from "path";
import { logger } from "../utils/logger.js";

interface SyncState {
  lastSync: number;
  syncedNotes: Record<string, { driveId: string, lastModified: number }>;
}

const getSyncFilePath = () => {
  const vaultPath = process.env.OBSIDIAN_VAULT_PATH;
  if (!vaultPath) throw new Error("OBSIDIAN_VAULT_PATH not set");
  return path.join(vaultPath, ".mcp-suite-sync.json");
};

export async function readSyncState(): Promise<SyncState> {
  try {
    const data = await fs.readFile(getSyncFilePath(), "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return { lastSync: 0, syncedNotes: {} };
  }
}

export async function writeSyncState(state: SyncState): Promise<void> {
  try {
    await fs.writeFile(getSyncFilePath(), JSON.stringify(state, null, 2), "utf-8");
  } catch (e) {
    logger.error("Failed to write sync state", e);
  }
}

export async function updateNoteSyncStatus(notePath: string, driveId: string, lastModified: number) {
  const state = await readSyncState();
  state.syncedNotes[notePath] = { driveId, lastModified };
  state.lastSync = Date.now();
  await writeSyncState(state);
}

export async function getNoteDriveId(notePath: string): Promise<string | undefined> {
  const state = await readSyncState();
  return state.syncedNotes[notePath]?.driveId;
}
