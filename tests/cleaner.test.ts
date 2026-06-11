import { describe, it, expect } from "vitest";
import { cleanObsidianMarkdown } from "../src/bridge/cleaner.js";

describe("cleanObsidianMarkdown", () => {
  it("strips YAML frontmatter", () => {
    const input = `---
title: Test Note
tags: [project, mcp]
---

# Hello World

Some content here.`;
    const result = cleanObsidianMarkdown(input);
    expect(result).not.toContain("---");
    expect(result).not.toContain("title: Test Note");
    expect(result).toContain("# Hello World");
    expect(result).toContain("Some content here.");
  });

  it("converts image embeds to [Embedded: ...] syntax", () => {
    const input = "Here is an image: ![[screenshot.png]]";
    const result = cleanObsidianMarkdown(input);
    expect(result).toBe("Here is an image: [Embedded: screenshot.png]");
  });

  it("converts aliased wikilinks to just the alias", () => {
    const input = "See [[Some Page|the alias]] for details.";
    const result = cleanObsidianMarkdown(input);
    expect(result).toBe("See the alias for details.");
  });

  it("converts plain wikilinks to just the page name", () => {
    const input = "Refer to [[My Note]] for more info.";
    const result = cleanObsidianMarkdown(input);
    expect(result).toBe("Refer to My Note for more info.");
  });

  it("removes block references (^block-id)", () => {
    const input = "Some paragraph text ^my-block-id";
    const result = cleanObsidianMarkdown(input);
    expect(result).toBe("Some paragraph text");
  });

  it("handles embeds before wikilinks (order matters)", () => {
    const input = "![[image.png]] and [[Page Link]]";
    const result = cleanObsidianMarkdown(input);
    expect(result).toBe("[Embedded: image.png] and Page Link");
  });

  it("handles content with no special Obsidian syntax", () => {
    const input = "Just a plain paragraph with **bold** and *italic*.";
    const result = cleanObsidianMarkdown(input);
    expect(result).toBe("Just a plain paragraph with **bold** and *italic*.");
  });

  it("handles empty content", () => {
    const input = "";
    const result = cleanObsidianMarkdown(input);
    expect(result).toBe("");
  });

  it("handles complex note with all features", () => {
    const input = `---
title: Complex Note
tags: [test]
---

# Main Title

See ![[diagram.png]] for the architecture.

Refer to [[MCP-Suite|the project]] and [[Another Page]] for context.

Some code block:
\`\`\`typescript
const x = 42;
\`\`\`

Final paragraph. ^ref-123`;

    const result = cleanObsidianMarkdown(input);
    expect(result).not.toContain("title: Complex Note");
    expect(result).toContain("[Embedded: diagram.png]");
    expect(result).toContain("the project");
    expect(result).not.toContain("[[");
    expect(result).toContain("Another Page");
    expect(result).toContain("const x = 42;");
    expect(result).not.toContain("^ref-123");
  });
});
