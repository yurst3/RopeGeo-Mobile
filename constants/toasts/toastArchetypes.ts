import type { ToastArchetype } from "./types";

export const TOAST_KEY_NETWORK_OFFLINE = "network-offline";
/** Single deduped "Retry" action toast for in-flight network errors while online. */
export const TOAST_KEY_NETWORK_RETRY = "network-retry";
export const TOAST_KEY_ROUTES_PROGRESS = "routes-progress";
export const TOAST_KEY_ROUTES_ERROR = "error-routes";
export const TOAST_KEY_ROUTE_PREVIEW_ERROR = "error-route-preview";
export const TOAST_KEY_SEARCH_ERROR = "error-search";
export const TOAST_KEY_SEARCH_NO_RESULTS = "search-no-results";
export const TOAST_KEY_SEARCH_REFRESHING = "search-refreshing";
export const TOAST_KEY_REGION_ERROR = "error-region";
export const TOAST_KEY_PAGE_ERROR = "error-page";
export const TOAST_KEY_DOWNLOAD_PROGRESS = "download-progress";
/** Prefix with `-${pageId}` for per-page dedupe (see `getToastArchetypeForKey`). */
export const TOAST_KEY_DOWNLOAD_CANCELLED = "download-cancelled";
export const TOAST_KEY_PAGE_SAVED = "saved-page";
export const TOAST_KEY_DISTANCE_GPS_TIMEOUT = "error-search-distance-gps-timeout";

/** Dev only: live `NetworkState` from expo-network (see `SHOW_NETWORK_STATE`). */
export const TOAST_KEY_DEV_NETWORK_IS_CONNECTED = "dev-network-isConnected";
export const TOAST_KEY_DEV_NETWORK_INTERNET_REACHABLE =
  "dev-network-isInternetReachable";

/**
 * Archetype defaults for exact keys. These values are defaults, not hard rules; callers may
 * override `allowedRoutes`/`durationMs`/variant-dependent fields at creation.
 */
export const TOAST_ARCHETYPE: Record<string, ToastArchetype> = {
  [TOAST_KEY_DEV_NETWORK_IS_CONNECTED]: {
    priority: 0,
    allowedRoutes: null,
    durationMs: null,
    variant: "pill",
    style: "info",
  },
  [TOAST_KEY_DEV_NETWORK_INTERNET_REACHABLE]: {
    priority: 0,
    allowedRoutes: null,
    durationMs: null,
    variant: "pill",
    style: "info",
  },
  [TOAST_KEY_NETWORK_OFFLINE]: {
    priority: 1,
    allowedRoutes: ["/explore", "/explore/search", "/explore/[id]/region"],
    durationMs: null,
    variant: "pill",
    style: "error",
  },
  [TOAST_KEY_NETWORK_RETRY]: {
    priority: 2,
    allowedRoutes: null,
    durationMs: null,
    variant: "action",
    style: "warning",
  },
  [TOAST_KEY_ROUTES_PROGRESS]: {
    priority: 3,
    allowedRoutes: ["/explore", "/explore/[id]/region"],
    durationMs: 3000,
    variant: "progress",
    style: "warning",
  },
  [TOAST_KEY_ROUTES_ERROR]: {
    priority: 2,
    allowedRoutes: null,
    durationMs: null,
    variant: "progress",
    style: "error",
  },
  [TOAST_KEY_ROUTE_PREVIEW_ERROR]: {
    priority: 2,
    allowedRoutes: null,
    durationMs: null,
    variant: "pill",
    style: "error",
  },
  [TOAST_KEY_SEARCH_ERROR]: {
    priority: 2,
    allowedRoutes: ["/explore/search"],
    durationMs: null,
    variant: "pill",
    style: "error",
  },
  [TOAST_KEY_SEARCH_NO_RESULTS]: {
    priority: 3,
    allowedRoutes: ["/explore/search"],
    durationMs: null,
    variant: "pill",
    style: "warning",
  },
  [TOAST_KEY_SEARCH_REFRESHING]: {
    priority: 3,
    allowedRoutes: ["/explore/search"],
    durationMs: null,
    variant: "pill",
    style: "warning",
  },
  [TOAST_KEY_REGION_ERROR]: {
    priority: 2,
    allowedRoutes: null,
    durationMs: null,
    variant: "pill",
    style: "error",
  },
  [TOAST_KEY_PAGE_ERROR]: {
    priority: 2,
    allowedRoutes: null,
    durationMs: null,
    variant: "pill",
    style: "error",
  },
  [TOAST_KEY_DOWNLOAD_PROGRESS]: {
    priority: 3,
    allowedRoutes: ["/explore/[id]/page", "/saved/[id]/page"],
    durationMs: 3000,
    variant: "progress",
    style: "warning",
  },
  [TOAST_KEY_DOWNLOAD_CANCELLED]: {
    priority: 3,
    allowedRoutes: ["/explore/[id]/page", "/saved/[id]/page"],
    durationMs: 5000,
    variant: "pill",
    style: "error",
  },
  [TOAST_KEY_PAGE_SAVED]: {
    priority: 4,
    allowedRoutes: ["/explore/[id]/page", "/saved/[id]/page"],
    durationMs: 5000,
    variant: "pill",
    style: "success",
  },
  [TOAST_KEY_DISTANCE_GPS_TIMEOUT]: {
    priority: 2,
    allowedRoutes: ["/explore/search"],
    durationMs: null,
    variant: "pill",
    style: "error",
  },
};
