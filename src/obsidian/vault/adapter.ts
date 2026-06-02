export interface VaultAdapter {
  // Notes
  listNotes(folder?: string, tag?: string, maxResults?: number): Promise<any[]>;
  readNote(path: string): Promise<string>;
  createNote(path: string, content: string): Promise<void>;
  updateNote(path: string, content: string, mode: "overwrite" | "append" | "prepend" | "patch"): Promise<void>;
  deleteNote(path: string): Promise<void>;
  
  // Search
  search(query: string, maxResults?: number): Promise<any[]>;
  searchByTag(tags: string[], matchAll?: boolean): Promise<string[]>;
  
  // Tags
  listTags(): Promise<Record<string, number>>;
  
  // Graph
  getBacklinks(path: string): Promise<string[]>;
  getOutlinks(path: string): Promise<string[]>;
  
  // Stats
  getStats(): Promise<{ noteCount: number, tagCount: number, sizeBytes?: number }>;
  getRecent(limit?: number): Promise<any[]>;
}
