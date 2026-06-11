import * as FileSystem from "expo-file-system/legacy";

export async function ensureParentDir(fileUri: string): Promise<void> {
  const last = fileUri.lastIndexOf("/");
  if (last <= 0) {
    return;
  }
  const parent = fileUri.slice(0, last);
  await FileSystem.makeDirectoryAsync(parent, { intermediates: true });
}
