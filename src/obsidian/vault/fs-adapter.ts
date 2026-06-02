import * as fs from "fs/promises";
import * as path from "path";
import { VaultAdapter } from "./adapter.js";
import { parseMarkdown } from "../../utils/markdown.js";
import { logger } from "../../utils/logger.js";

export class FileSystemAdapter implements VaultAdapter {
  private vaultPath: string;

  constructor(vaultPath: string) {
    this.vaultPath = vaultPath;
  }

  private resolvePath(notePath: string): string {
    const p = notePath.endsWith(".md") ? notePath : `${notePath}.md`;
    const resolved = path.join(this.vaultPath, p);
    if (!resolved.startsWith(this.vaultPath)) {
      throw new Error(`Access denied: path ${notePath} escapes vault boundary.`);
    }
    return resolved;
  }

  async listNotes(folder?: string, tag?: string, maxResults?: number): Promise<any[]> {
    const results: any[] = [];
    
    async function scanDir(dir: string) {
      if (maxResults && results.length >= maxResults) return;
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith(".")) continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          const relativePath = path.relative(dir, fullPath); // actually relative to vaultPath is better
          // Need to fix this relative path logic
          const relToVault = path.relative(dir.startsWith(fullPath) ? dir : dir, fullPath);
        }
      }
    }
    
    // Better implementation for scanning
    const scan = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith(".")) continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          const relPath = path.relative(this.vaultPath, fullPath).replace(/\\/g, '/');
          
          if (folder && !relPath.startsWith(folder)) continue;
          
          if (tag) {
            const content = await fs.readFile(fullPath, "utf-8");
            if (!content.includes(tag)) continue; // Simplified tag check
          }

          const stats = await fs.stat(fullPath);
          results.push({
            path: relPath,
            name: entry.name,
            mtime: stats.mtimeMs,
            size: stats.size
          });

          if (maxResults && results.length >= maxResults) break;
        }
      }
    };

    await scan(this.vaultPath);
    return results;
  }

  async readNote(notePath: string): Promise<string> {
    const fullPath = this.resolvePath(notePath);
    return fs.readFile(fullPath, "utf-8");
  }

  async createNote(notePath: string, content: string): Promise<void> {
    const fullPath = this.resolvePath(notePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, "utf-8");
  }

  async updateNote(notePath: string, content: string, mode: "overwrite" | "append" | "prepend" | "patch"): Promise<void> {
    const fullPath = this.resolvePath(notePath);
    
    if (mode === "overwrite") {
      await fs.writeFile(fullPath, content, "utf-8");
      return;
    }

    const existing = await fs.readFile(fullPath, "utf-8");
    if (mode === "append") {
      await fs.writeFile(fullPath, existing + "\n" + content, "utf-8");
    } else if (mode === "prepend") {
      await fs.writeFile(fullPath, content + "\n" + existing, "utf-8");
    } else if (mode === "patch") {
      // Simplistic patch for now
      throw new Error("Patch mode not fully implemented for FS adapter");
    }
  }

  async deleteNote(notePath: string): Promise<void> {
    const fullPath = this.resolvePath(notePath);
    await fs.unlink(fullPath);
  }

  async search(query: string, maxResults?: number): Promise<any[]> {
    // Very basic grep-style search
    const results: any[] = [];
    const notes = await this.listNotes();
    
    for (const note of notes) {
      const content = await this.readNote(note.path);
      if (content.toLowerCase().includes(query.toLowerCase())) {
        results.push(note);
        if (maxResults && results.length >= maxResults) break;
      }
    }
    return results;
  }

  async searchByTag(tags: string[], matchAll?: boolean): Promise<string[]> {
    const results: string[] = [];
    const notes = await this.listNotes();
    
    for (const note of notes) {
      const content = await this.readNote(note.path);
      const parsed = parseMarkdown(content);
      const fileTags = Array.isArray(parsed.frontmatter.tags) ? parsed.frontmatter.tags : [];
      // Also could check body tags
      
      const hasTags = matchAll 
        ? tags.every(t => fileTags.includes(t) || content.includes(`#${t}`))
        : tags.some(t => fileTags.includes(t) || content.includes(`#${t}`));

      if (hasTags) {
        results.push(note.path);
      }
    }
    return results;
  }

  async listTags(): Promise<Record<string, number>> {
    const tags: Record<string, number> = {};
    const notes = await this.listNotes();
    
    for (const note of notes) {
      const content = await this.readNote(note.path);
      const parsed = parseMarkdown(content);
      const fileTags = Array.isArray(parsed.frontmatter.tags) ? parsed.frontmatter.tags : [];
      
      for (const t of fileTags) {
        tags[t] = (tags[t] || 0) + 1;
      }
      
      const bodyTags = content.match(/#[a-zA-Z0-9_-]+/g) || [];
      for (let t of bodyTags) {
        t = t.substring(1); // remove #
        tags[t] = (tags[t] || 0) + 1;
      }
    }
    return tags;
  }

  async getBacklinks(notePath: string): Promise<string[]> {
    const results: string[] = [];
    const notes = await this.listNotes();
    const basename = path.basename(notePath, ".md");
    
    for (const note of notes) {
      if (note.path === notePath) continue;
      const content = await this.readNote(note.path);
      if (content.includes(`[[${basename}]]`) || content.includes(`[[${basename}|`)) {
        results.push(note.path);
      }
    }
    return results;
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
    const notes = await this.listNotes();
    const tags = await this.listTags();
    const size = notes.reduce((acc, note) => acc + note.size, 0);
    
    return {
      noteCount: notes.length,
      tagCount: Object.keys(tags).length,
      sizeBytes: size
    };
  }

  async getRecent(limit: number = 10): Promise<any[]> {
    const notes = await this.listNotes();
    return notes.sort((a, b) => b.mtime - a.mtime).slice(0, limit);
  }
}
