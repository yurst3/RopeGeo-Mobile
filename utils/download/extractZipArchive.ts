import * as FileSystem from "expo-file-system/legacy";
import { unzipSync } from "fflate";
import { ensureParentDir } from "./ensureParentDir";

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

/** Extracts a downloaded page bundle ZIP into the page root (relative paths preserved). */
export async function extractZipArchive(args: {
  zipPath: string;
  destRoot: string;
}): Promise<void> {
  const b64 = await FileSystem.readAsStringAsync(args.zipPath, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const entries = unzipSync(base64ToBytes(b64));
  for (const [name, content] of Object.entries(entries)) {
    if (name.endsWith("/")) {
      continue;
    }
    const destPath = `${args.destRoot}${name}`;
    await ensureParentDir(destPath);
    await FileSystem.writeAsStringAsync(destPath, bytesToBase64(content), {
      encoding: FileSystem.EncodingType.Base64,
    });
  }
  await FileSystem.deleteAsync(args.zipPath, { idempotent: true });
}
