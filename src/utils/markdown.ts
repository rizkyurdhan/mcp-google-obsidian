import matter from "gray-matter";

export function parseMarkdown(content: string) {
  const parsed = matter(content);
  return {
    frontmatter: parsed.data,
    content: parsed.content,
  };
}

export function stringifyMarkdown(content: string, frontmatter: Record<string, any>) {
  if (!frontmatter || Object.keys(frontmatter).length === 0) {
    return content;
  }
  return matter.stringify(content, frontmatter);
}
