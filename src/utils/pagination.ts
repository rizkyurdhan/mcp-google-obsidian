/**
 * Helper to handle pagination for Google APIs
 */
export async function paginate<T>(
  fetchPage: (pageToken?: string) => Promise<{ items: T[]; nextPageToken?: string | null }>,
  maxResults: number = 100
): Promise<T[]> {
  let items: T[] = [];
  let pageToken: string | undefined;

  do {
    const response = await fetchPage(pageToken);
    items = items.concat(response.items);
    
    if (items.length >= maxResults) {
      return items.slice(0, maxResults);
    }
    
    pageToken = response.nextPageToken || undefined;
  } while (pageToken);

  return items;
}
