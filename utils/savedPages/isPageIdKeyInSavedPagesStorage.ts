import AsyncStorage from "@react-native-async-storage/async-storage";
import { SAVED_PAGES_STORAGE_KEY } from "ropegeo-common/models";

/**
 * True if `pageId` is still a key in the persisted saved-pages map (same shape as
 * {@link SavedPagesContext} / `persistEntries`).
 */
export async function isPageIdKeyInSavedPagesStorage(
  pageId: string,
): Promise<boolean> {
  if (pageId === "") return false;
  const raw = await AsyncStorage.getItem(SAVED_PAGES_STORAGE_KEY);
  if (raw == null || raw === "") return false;
  try {
    const outer = JSON.parse(raw) as unknown;
    if (outer == null || typeof outer !== "object" || Array.isArray(outer)) {
      return false;
    }
    return Object.prototype.hasOwnProperty.call(outer, pageId);
  } catch {
    return false;
  }
}
