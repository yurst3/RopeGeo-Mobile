import * as FileSystem from "expo-file-system/legacy";
import { gunzipSync } from "fflate";

/** Gzip magic bytes — Mapbox local `file://` tiles must be raw MVT, not gzip. */
function isGzip(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Writes raw MVT bytes when the file is gzip-compressed (common for API tiles).
 * Mapbox decompresses HTTP tiles via Content-Encoding but not local `file://` tiles.
 */
export async function gunzipVectorTileFileIfNeeded(uri: string): Promise<boolean> {
  const b64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const data = base64ToBytes(b64);
  if (!isGzip(data)) {
    return false;
  }
  const raw = gunzipSync(data);
  await FileSystem.writeAsStringAsync(uri, bytesToBase64(raw), {
    encoding: FileSystem.EncodingType.Base64,
  });
  return true;
}

/** `file://…/mapdata/tiles/{mapDataId}/` from an offline tile URL template. */
export function offlineVectorTilesRootFromTemplate(
  offlineTilesTemplate: string,
): string | null {
  const zIdx = offlineTilesTemplate.indexOf("/{z}/");
  if (zIdx === -1) {
    return null;
  }
  return offlineTilesTemplate.slice(0, zIdx + 1);
}

async function listPbfFilesRecursive(dir: string): Promise<string[]> {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists || !info.isDirectory) {
    return [];
  }
  const names = await FileSystem.readDirectoryAsync(dir);
  const out: string[] = [];
  for (const name of names) {
    const child = dir.endsWith("/") ? `${dir}${name}` : `${dir}/${name}`;
    if (name.endsWith(".pbf")) {
      out.push(child);
    } else {
      out.push(...(await listPbfFilesRecursive(child)));
    }
  }
  return out;
}

/** Ensures all `.pbf` under the offline tiles root are uncompressed for Mapbox. */
export async function prepareOfflineVectorTilesForMapbox(
  tilesRoot: string,
): Promise<{ scanned: number; gunzipped: number }> {
  const files = await listPbfFilesRecursive(tilesRoot);
  let gunzipped = 0;
  for (const file of files) {
    if (await gunzipVectorTileFileIfNeeded(file)) {
      gunzipped += 1;
    }
  }
  return { scanned: files.length, gunzipped };
}
