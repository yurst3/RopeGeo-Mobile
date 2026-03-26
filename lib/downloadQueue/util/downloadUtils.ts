import * as FileSystem from "expo-file-system/legacy";

export function mapboxPackName(pageId: string): string {
  return `ropegeo-page-${pageId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

export function extFromUrl(url: string): string {
  try {
    const p = new URL(url).pathname;
    const i = p.lastIndexOf(".");
    if (i >= 0 && i < p.length - 1) return p.slice(i);
  } catch {
    /* ignore */
  }
  return ".bin";
}

export async function ensureParentDir(fileUri: string): Promise<void> {
  const last = fileUri.lastIndexOf("/");
  if (last <= 0) return;
  const parent = fileUri.slice(0, last);
  await FileSystem.makeDirectoryAsync(parent, { intermediates: true });
}
