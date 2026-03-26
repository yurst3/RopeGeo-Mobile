/**
 * Display URI for React Native `Image` / expo-image (local file).
 */
export function toDisplayUri(localPath: string): string {
  if (localPath.startsWith("file://")) {
    return localPath;
  }
  return localPath.startsWith("/") ? `file://${localPath}` : `file:///${localPath}`;
}
