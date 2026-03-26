/**
 * Returns relative path `tiles/{mapDataId}/z/x/y.pbf` from a public tile URL.
 */
export function relativePathFromTileUrl(tileUrl: string): string {
  const u = new URL(tileUrl);
  const parts = u.pathname.split("/").filter(Boolean);
  const i = parts.indexOf("tiles");
  if (i === -1 || i + 3 >= parts.length) {
    throw new Error(`Unexpected tile URL path: ${tileUrl}`);
  }
  return parts.slice(i).join("/");
}
