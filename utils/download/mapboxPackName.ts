export function mapboxPackName(pageId: string): string {
  return `ropegeo-page-${pageId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}
