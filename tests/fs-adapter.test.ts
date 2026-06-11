import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FileSystemAdapter } from "../src/obsidian/vault/fs-adapter.js";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

describe("FileSystemAdapter", () => {
  let tmpDir: string;
  let adapter: FileSystemAdapter;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-vault-test-"));
    adapter = new FileSystemAdapter(tmpDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  // ── Path Traversal Security ──────────────────────────────────

  describe("path traversal protection", () => {
    it("blocks directory traversal with ../", () => {
      expect(() => {
        // Access the private method via any cast
        (adapter as any).resolvePath("../../etc/passwd");
      }).toThrow("Access denied");
    });

    it("normalizes absolute-looking paths to stay inside vault", () => {
      // path.join(base, "/etc/passwd") strips the leading / and keeps it in-vault
      // This is safe behavior — verify it stays inside the vault boundary
      const resolved = (adapter as any).resolvePath("/etc/passwd");
      expect(resolved.startsWith(tmpDir)).toBe(true);
      expect(resolved).toContain("etc");
    });

    it("blocks traversal with nested ../../../", () => {
      expect(() => {
        (adapter as any).resolvePath("folder/../../../etc/shadow");
      }).toThrow("Access denied");
    });

    it("allows valid paths within the vault", () => {
      const resolved = (adapter as any).resolvePath("notes/test.md");
      expect(resolved.startsWith(tmpDir)).toBe(true);
    });

    it("auto-appends .md extension if missing", () => {
      const resolved = (adapter as any).resolvePath("test");
      expect(resolved).toBe(path.resolve(tmpDir, "test.md"));
    });

    it("does not double-append .md", () => {
      const resolved = (adapter as any).resolvePath("test.md");
      expect(resolved).toBe(path.resolve(tmpDir, "test.md"));
      expect(resolved).not.toMatch(/\.md\.md$/);
    });
  });

  // ── Note CRUD ────────────────────────────────────────────────

  describe("createNote / readNote", () => {
    it("creates and reads a note", async () => {
      await adapter.createNote("hello.md", "# Hello World");
      const content = await adapter.readNote("hello.md");
      expect(content).toBe("# Hello World");
    });

    it("creates nested directories automatically", async () => {
      await adapter.createNote("deep/nested/folder/note.md", "nested content");
      const content = await adapter.readNote("deep/nested/folder/note.md");
      expect(content).toBe("nested content");
    });

    it("throws when reading a non-existent note", async () => {
      await expect(adapter.readNote("does-not-exist.md")).rejects.toThrow();
    });
  });

  describe("updateNote", () => {
    beforeEach(async () => {
      await adapter.createNote("update-test.md", "original content");
    });

    it("overwrites content", async () => {
      await adapter.updateNote("update-test.md", "new content", "overwrite");
      const content = await adapter.readNote("update-test.md");
      expect(content).toBe("new content");
    });

    it("appends content", async () => {
      await adapter.updateNote("update-test.md", "appended", "append");
      const content = await adapter.readNote("update-test.md");
      expect(content).toBe("original content\nappended");
    });

    it("prepends content", async () => {
      await adapter.updateNote("update-test.md", "prepended", "prepend");
      const content = await adapter.readNote("update-test.md");
      expect(content).toBe("prepended\noriginal content");
    });

    it("throws on patch mode (unimplemented)", async () => {
      await expect(
        adapter.updateNote("update-test.md", "patch data", "patch")
      ).rejects.toThrow("Patch mode not fully implemented");
    });
  });

  describe("deleteNote", () => {
    it("deletes a note", async () => {
      await adapter.createNote("to-delete.md", "bye");
      await adapter.deleteNote("to-delete.md");
      await expect(adapter.readNote("to-delete.md")).rejects.toThrow();
    });
  });

  // ── Listing & Search ─────────────────────────────────────────

  describe("listNotes", () => {
    beforeEach(async () => {
      await adapter.createNote("note1.md", "# Note 1\n#project");
      await adapter.createNote("note2.md", "# Note 2");
      await adapter.createNote("folder/note3.md", "# Note 3\n#project");
    });

    it("lists all notes", async () => {
      const notes = await adapter.listNotes();
      expect(notes.length).toBe(3);
    });

    it("filters by folder", async () => {
      const notes = await adapter.listNotes("folder");
      expect(notes.length).toBe(1);
      expect(notes[0].path).toBe("folder/note3.md");
    });

    it("limits results with maxResults", async () => {
      const notes = await adapter.listNotes(undefined, undefined, 2);
      expect(notes.length).toBe(2);
    });

    it("filters by tag (simple string match)", async () => {
      const notes = await adapter.listNotes(undefined, "#project");
      expect(notes.length).toBe(2);
    });

    it("ignores dotfiles/folders", async () => {
      await fs.mkdir(path.join(tmpDir, ".obsidian"), { recursive: true });
      await fs.writeFile(path.join(tmpDir, ".obsidian", "config.md"), "hidden");
      const notes = await adapter.listNotes();
      expect(notes.length).toBe(3); // still 3, .obsidian ignored
    });
  });

  describe("search", () => {
    beforeEach(async () => {
      await adapter.createNote("a.md", "TypeScript is great");
      await adapter.createNote("b.md", "Python is also good");
      await adapter.createNote("c.md", "typescript lowercase match");
    });

    it("finds notes matching a query (case-insensitive)", async () => {
      const results = await adapter.search("typescript");
      expect(results.length).toBe(2);
    });

    it("returns empty for no matches", async () => {
      const results = await adapter.search("rust");
      expect(results.length).toBe(0);
    });

    it("respects maxResults", async () => {
      const results = await adapter.search("is", 1);
      expect(results.length).toBe(1);
    });
  });

  // ── Graph: Backlinks & Outlinks ──────────────────────────────

  describe("getBacklinks / getOutlinks", () => {
    beforeEach(async () => {
      await adapter.createNote("target.md", "# Target Note");
      await adapter.createNote("linker.md", "See [[target]] for details.");
      await adapter.createNote(
        "aliased.md",
        "Also see [[target|the target note]]."
      );
      await adapter.createNote("no-link.md", "No links here.");
    });

    it("finds backlinks from wikilinks", async () => {
      const backlinks = await adapter.getBacklinks("target.md");
      expect(backlinks).toContain("linker.md");
    });

    it("finds backlinks from aliased wikilinks", async () => {
      const backlinks = await adapter.getBacklinks("target.md");
      expect(backlinks).toContain("aliased.md");
    });

    it("excludes the note itself from backlinks", async () => {
      const backlinks = await adapter.getBacklinks("target.md");
      expect(backlinks).not.toContain("target.md");
    });

    it("extracts outlinks from a note", async () => {
      const outlinks = await adapter.getOutlinks("linker.md");
      expect(outlinks).toContain("target");
    });

    it("strips aliases from outlinks", async () => {
      const outlinks = await adapter.getOutlinks("aliased.md");
      expect(outlinks).toContain("target");
      expect(outlinks).not.toContain("target|the target note");
    });
  });

  // ── Stats & Recent ───────────────────────────────────────────

  describe("getStats", () => {
    it("returns correct note and tag counts", async () => {
      await adapter.createNote(
        "s1.md",
        "---\ntags: [a, b]\n---\n# Note\n#c"
      );
      await adapter.createNote("s2.md", "---\ntags: [a]\n---\n# Note 2");
      const stats = await adapter.getStats();
      expect(stats.noteCount).toBe(2);
      expect(stats.tagCount).toBeGreaterThanOrEqual(2); // at least a, b (possibly c)
    });
  });

  describe("getRecent", () => {
    it("returns notes sorted by mtime descending", async () => {
      await adapter.createNote("old.md", "old");
      // Small delay to guarantee different mtime
      await new Promise((r) => setTimeout(r, 50));
      await adapter.createNote("new.md", "new");

      const recent = await adapter.getRecent(2);
      expect(recent.length).toBe(2);
      expect(recent[0].path).toBe("new.md");
      expect(recent[1].path).toBe("old.md");
    });

    it("respects the limit parameter", async () => {
      await adapter.createNote("a.md", "a");
      await adapter.createNote("b.md", "b");
      await adapter.createNote("c.md", "c");
      const recent = await adapter.getRecent(1);
      expect(recent.length).toBe(1);
    });
  });
});
