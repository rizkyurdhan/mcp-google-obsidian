import { describe, it, expect } from "vitest";
import { parseMarkdown, stringifyMarkdown } from "../src/utils/markdown.js";

describe("parseMarkdown", () => {
  it("parses frontmatter and content", () => {
    const input = `---
title: Test
tags: [a, b]
---

# Body content`;

    const result = parseMarkdown(input);
    expect(result.frontmatter.title).toBe("Test");
    expect(result.frontmatter.tags).toEqual(["a", "b"]);
    expect(result.content).toContain("# Body content");
  });

  it("handles content with no frontmatter", () => {
    const input = "# No Frontmatter\n\nJust body.";
    const result = parseMarkdown(input);
    expect(result.frontmatter).toEqual({});
    expect(result.content).toContain("# No Frontmatter");
    expect(result.content).toContain("Just body.");
  });

  it("handles empty content", () => {
    const input = "";
    const result = parseMarkdown(input);
    expect(result.frontmatter).toEqual({});
    expect(result.content).toBe("");
  });

  it("handles frontmatter-only content", () => {
    const input = `---
title: Only Frontmatter
---
`;
    const result = parseMarkdown(input);
    expect(result.frontmatter.title).toBe("Only Frontmatter");
    expect(result.content.trim()).toBe("");
  });
});

describe("stringifyMarkdown", () => {
  it("adds frontmatter to content", () => {
    const result = stringifyMarkdown("# Hello", { title: "Test" });
    expect(result).toContain("---");
    expect(result).toContain("title: Test");
    expect(result).toContain("# Hello");
  });

  it("returns content as-is when frontmatter is empty", () => {
    const result = stringifyMarkdown("# Hello", {});
    expect(result).toBe("# Hello");
  });

  it("returns content as-is when frontmatter is null-ish", () => {
    const result = stringifyMarkdown("# Hello", null as any);
    expect(result).toBe("# Hello");
  });
});
