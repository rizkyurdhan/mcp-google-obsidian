import { getVaultAdapter } from "../obsidian/vault/index.js";
import { cleanObsidianMarkdown } from "./cleaner.js";

/**
 * Merges multiple Obsidian notes into a single cohesive Markdown document.
 */
export async function mergeNotes(notePaths: string[], title: string = "Merged Notes"): Promise<string> {
  const adapter = await getVaultAdapter();
  
  let mergedDoc = `# ${title}\n\n`;

  for (const path of notePaths) {
    try {
      const rawContent = await adapter.readNote(path);
      const cleanedContent = cleanObsidianMarkdown(rawContent);
      
      const noteTitle = path.split('/').pop()?.replace('.md', '') || path;
      mergedDoc += `## ${noteTitle}\n\n${cleanedContent}\n\n---\n\n`;
    } catch (e) {
      mergedDoc += `## Error reading note: ${path}\n\n[Content not available]\n\n---\n\n`;
    }
  }

  return mergedDoc;
}
