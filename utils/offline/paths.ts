import * as FileSystem from "expo-file-system/legacy";

/** Root `file://` URI for one saved page's offline bundle (trailing slash). */
export function getOfflinePageRootUri(pageId: string): string {
  const base = FileSystem.documentDirectory;
  if (base == null) {
    throw new Error("documentDirectory is not available");
  }
  const trimmed = base.endsWith("/") ? base : `${base}/`;
  return `${trimmed}ropegeo/offline/pages/${pageId}/`;
}

export function getOfflinePageJsonUri(pageId: string): string {
  return `${getOfflinePageRootUri(pageId)}page-response.json`;
}

/** Directory root for vector tiles (trailing slash). */
export function getOfflineMapDataRootUri(pageId: string): string {
  return `${getOfflinePageRootUri(pageId)}mapdata/`;
}

/** Merged routes GeoJSON for a centered-region page minimap (`file://` URI). */
export function getOfflineRegionRoutesGeojsonUri(pageId: string, regionId: string): string {
  return `${getOfflinePageRootUri(pageId)}regions/${regionId}/routes.geojson`;
}

export function getOfflineImageFileUri(pageId: string, imageId: string, slot: string): string {
  return `${getOfflinePageRootUri(pageId)}images/${imageId}-${slot}`;
}
