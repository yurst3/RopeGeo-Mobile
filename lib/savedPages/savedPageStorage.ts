import AsyncStorage from "@react-native-async-storage/async-storage";
import { SavedPage, SAVED_PAGES_STORAGE_KEY } from "ropegeo-common/models";

async function loadSavedPageMap(): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(SAVED_PAGES_STORAGE_KEY);
  if (raw == null || raw === "") {
    return {};
  }
  try {
    const outer = JSON.parse(raw) as unknown;
    if (outer == null || typeof outer !== "object" || Array.isArray(outer)) {
      return {};
    }
    const map: Record<string, string> = {};
    for (const [key, val] of Object.entries(outer as Record<string, unknown>)) {
      map[key] = typeof val === "string" ? val : JSON.stringify(val);
    }
    return map;
  } catch {
    return {};
  }
}

/** Updates one saved page row on disk (usable outside React, e.g. background tasks). */
export async function replaceSavedPageInStorage(entry: SavedPage): Promise<void> {
  const map = await loadSavedPageMap();
  map[entry.preview.id] = entry.toString();
  await AsyncStorage.setItem(SAVED_PAGES_STORAGE_KEY, JSON.stringify(map));
}
