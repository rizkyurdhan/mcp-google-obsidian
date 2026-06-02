import { parseMarkdown } from "../utils/markdown.js";

/**
 * Cleans Obsidian markdown syntax into standard markdown.
 * 1. Strips frontmatter
 * 2. Converts wikilinks [[Page|Alias]] to standard links or raw text
 * 3. Removes Obsidian-specific tags or embeds
 */
export function cleanObsidianMarkdown(content: string): string {
  // 1. Strip frontmatter
  const parsed = parseMarkdown(content);
  let text = parsed.content;

  // 2. Remove embeds (e.g. ![[image.png]])
  text = text.replace(/!\[\[(.*?)\]\]/g, '[Embedded: $1]');

  // 3. Convert wikilinks
  // [[Page|Alias]] -> Alias
  // [[Page]] -> Page
  text = text.replace(/\[\[(.*?)\|(.*?)\]\]/g, '$2');
  text = text.replace(/\[\[(.*?)\]\]/g, '$1');

  // 4. Remove block references (^block-id)
  text = text.replace(/\^[a-zA-Z0-9-]+$/gm, '');

  return text.trim();
}
