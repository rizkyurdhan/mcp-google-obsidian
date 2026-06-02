import { VaultAdapter } from "./adapter.js";
import { logger } from "../../utils/logger.js";

export class RestApiAdapter implements VaultAdapter {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const headers: Record<string, string> = {
      "Accept": "application/json",
      ...options.headers as Record<string, string>
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    // Workaround for self-signed certs from the Local REST API plugin
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    const url = `${this.baseUrl}${endpoint}`;
    logger.debug(`REST API ${options.method || "GET"} ${url}`);
    
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      throw new Error(`Obsidian REST API error: ${response.status} ${response.statusText}`);
    }

    if (response.status === 204) return null;

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }
    return response.text();
  }

  async listNotes(folder?: string, tag?: string, maxResults?: number): Promise<any[]> {
    const query = folder ? `path:"${folder}"` : ""; // Simplified
    if (query) {
       const res = await this.request(`/search/simple/?query=${encodeURIComponent(query)}`, { method: 'POST' });
       return res;
    }
    
    // We could implement this by fetching the root directory and traversing, 
    // but REST API /search is better.
    throw new Error("listNotes requires query parameter for REST adapter currently");
  }

  async readNote(notePath: string): Promise<string> {
    const p = notePath.endsWith(".md") ? notePath : `${notePath}.md`;
    return this.request(`/vault/${encodeURIComponent(p)}`);
  }

  async createNote(notePath: string, content: string): Promise<void> {
    const p = notePath.endsWith(".md") ? notePath : `${notePath}.md`;
    await this.request(`/vault/${encodeURIComponent(p)}`, {
      method: "PUT",
      headers: { "Content-Type": "text/markdown" },
      body: content
    });
  }

  async updateNote(notePath: string, content: string, mode: "overwrite" | "append" | "prepend" | "patch"): Promise<void> {
    const p = notePath.endsWith(".md") ? notePath : `${notePath}.md`;
    
    if (mode === "overwrite") {
      await this.createNote(p, content);
      return;
    }

    if (mode === "patch") {
      throw new Error("Patch mode requires structural request body for REST adapter");
    }

    // append/prepend requires fetching then writing, or using specific POST endpoints if available
    const existing = await this.readNote(p);
    const newContent = mode === "append" ? `${existing}\n${content}` : `${content}\n${existing}`;
    await this.createNote(p, newContent);
  }

  async deleteNote(notePath: string): Promise<void> {
    const p = notePath.endsWith(".md") ? notePath : `${notePath}.md`;
    await this.request(`/vault/${encodeURIComponent(p)}`, { method: "DELETE" });
  }

  async search(query: string, maxResults?: number): Promise<any[]> {
    const res = await this.request(`/search/simple/?query=${encodeURIComponent(query)}`, { method: 'POST' });
    if (maxResults && Array.isArray(res)) {
      return res.slice(0, maxResults);
    }
    return res || [];
  }

  async searchByTag(tags: string[], matchAll?: boolean): Promise<string[]> {
    const query = tags.map(t => `tag:#${t}`).join(matchAll ? " " : " OR ");
    const res = await this.search(query);
    return res.map(r => r.filename);
  }

  async listTags(): Promise<Record<string, number>> {
    const res = await this.request("/tags/");
    return res.tags || {};
  }

  async getBacklinks(notePath: string): Promise<string[]> {
    // Requires searching for the link
    const basename = notePath.replace(/\.md$/, "");
    const res = await this.search(`[[${basename}]]`);
    return res.map(r => r.filename);
  }

  async getOutlinks(notePath: string): Promise<string[]> {
    const content = await this.readNote(notePath);
    const matches = content.match(/\[\[(.*?)\]\]/g) || [];
    return matches.map(m => {
      const inner = m.substring(2, m.length - 2);
      return inner.split("|")[0]; // remove alias
    });
  }

  async getStats(): Promise<{ noteCount: number; tagCount: number; sizeBytes?: number }> {
    throw new Error("getStats not fully implemented for REST API without full scan");
  }

  async getRecent(limit?: number): Promise<any[]> {
    throw new Error("getRecent not implemented for REST API without search sort");
  }
}
