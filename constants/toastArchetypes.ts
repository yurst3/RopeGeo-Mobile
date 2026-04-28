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
export const TOAST_KEY_PAGE_SAVED = "saved-page";
export const TOAST_KEY_DISTANCE_GPS_TIMEOUT = "error-search-distance-gps-timeout";

/** Dev only: live `NetworkState` from expo-network (see `SHOW_NETWORK_STATE`). */
export const TOAST_KEY_DEV_NETWORK_IS_CONNECTED = "dev-network-isConnected";
export const TOAST_KEY_DEV_NETWORK_INTERNET_REACHABLE =
  "dev-network-isInternetReachable";

export type ToastMode = "pill" | "progress" | "action";

export type ToastArchetype = {
  /** Lower number = closer to stack anchor (higher on screen). */
  priority: number;
  /**
   * Whitelist of route patterns where this toast may render. Supports dynamic segments (e.g.
   * `/explore/[id]/region`). `null` means globally allowed.
   */
  allowedRoutes: string[] | null;
  /** Default duration; callers may override on creation/upsert/update. */
  durationMs: number | null;
  /** Preferred UI mode for this toast family. */
  mode: ToastMode;
};

/**
 * Archetype defaults for exact keys. These values are defaults, not hard rules; callers may
 * override `allowedRoutes`/`durationMs`/mode-dependent fields at creation.
 */
export const TOAST_ARCHETYPE: Record<string, ToastArchetype> = {
  [TOAST_KEY_DEV_NETWORK_IS_CONNECTED]: {
    priority: 0,
    // Override on creation for per-screen dev overlays if needed.
    allowedRoutes: null,
    durationMs: null,
    mode: "pill",
  },
  [TOAST_KEY_DEV_NETWORK_INTERNET_REACHABLE]: {
    priority: 0,
    // Override on creation for per-screen dev overlays if needed.
    allowedRoutes: null,
    durationMs: null,
    mode: "pill",
  },
  [TOAST_KEY_NETWORK_OFFLINE]: {
    priority: 1,
    allowedRoutes: ["/explore", "/explore/search", "/explore/[id]/region"],
    durationMs: null,
    mode: "pill",
  },
  [TOAST_KEY_NETWORK_RETRY]: {
    priority: 2,
    // Override to the current route on creation (screen-specific retry CTA).
    allowedRoutes: null,
    durationMs: null,
    mode: "action",
  },
  [TOAST_KEY_ROUTES_PROGRESS]: {
    priority: 3,
    // Override to either `/explore` OR `/explore/[id]/region` on creation, never both.
    allowedRoutes: ["/explore", "/explore/[id]/region"],
    durationMs: 3000,
    mode: "progress",
  },
  [TOAST_KEY_ROUTES_ERROR]: {
    priority: 2,
    // Override to one specific route on creation.
    allowedRoutes: null,
    durationMs: null,
    mode: "progress",
  },
  [TOAST_KEY_ROUTE_PREVIEW_ERROR]: {
    priority: 2,
    // Override to one specific route on creation.
    allowedRoutes: null,
    durationMs: null,
    mode: "pill",
  },
  [TOAST_KEY_SEARCH_ERROR]: {
    priority: 2,
    allowedRoutes: ["/explore/search"],
    durationMs: null,
    mode: "pill",
  },
  [TOAST_KEY_SEARCH_NO_RESULTS]: {
    priority: 3,
    allowedRoutes: ["/explore/search"],
    durationMs: null,
    mode: "pill",
  },
  [TOAST_KEY_SEARCH_REFRESHING]: {
    priority: 3,
    allowedRoutes: ["/explore/search"],
    durationMs: null,
    mode: "pill",
  },
  [TOAST_KEY_REGION_ERROR]: {
    priority: 2,
    // Override to one specific route on creation.
    allowedRoutes: null,
    durationMs: null,
    mode: "pill",
  },
  [TOAST_KEY_PAGE_ERROR]: {
    priority: 2,
    // Override to one specific route on creation.
    allowedRoutes: null,
    durationMs: null,
    mode: "pill",
  },
  [TOAST_KEY_DOWNLOAD_PROGRESS]: {
    priority: 3,
    // Override to one specific page id on creation; allow explore + saved variants of that page.
    allowedRoutes: ["/explore/[id]/page", "/saved/[id]/page"],
    durationMs: 3000,
    mode: "progress",
  },
  [TOAST_KEY_PAGE_SAVED]: {
    priority: 4,
    // Override to one specific page id on creation; allow explore + saved variants of that page.
    allowedRoutes: ["/explore/[id]/page", "/saved/[id]/page"],
    durationMs: 5000,
    mode: "pill",
  },
  [TOAST_KEY_DISTANCE_GPS_TIMEOUT]: {
    priority: 2,
    allowedRoutes: ["/explore/search"],
    durationMs: null,
    mode: "pill",
  },
};

function escapeRegexLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function patternToRegex(pattern: string): RegExp {
  const normalized = normalizeRoutePath(pattern);
  const parts = normalized.split("/").filter((p) => p.length > 0);
  const body = parts
    .map((part) =>
      part.startsWith("[") && part.endsWith("]") ? "[^/]+" : escapeRegexLiteral(part),
    )
    .join("/");
  return new RegExp(`^/${body}$`);
}

export function normalizeRoutePath(route: string): string {
  if (route === "") return "/";
  const withoutQuery = route.split("?")[0]?.split("#")[0] ?? route;
  if (withoutQuery.length <= 1) return "/";
  return withoutQuery.endsWith("/") ? withoutQuery.slice(0, -1) : withoutQuery;
}

export function routeMatchesPattern(route: string, pattern: string): boolean {
  return patternToRegex(pattern).test(normalizeRoutePath(route));
}

export function routeAllowedByPatterns(
  route: string,
  allowedRoutes: string[] | null | undefined,
): boolean {
  if (allowedRoutes == null) return true;
  if (allowedRoutes.length === 0) return false;
  const normalizedRoute = normalizeRoutePath(route);
  return allowedRoutes.some((pattern) => routeMatchesPattern(normalizedRoute, pattern));
}

function archetypeForErrorFamily(key: string): ToastArchetype | null {
  if (key.startsWith("error-")) {
    return {
      priority: 2,
      // Override to one specific route on creation.
      allowedRoutes: null,
      durationMs: null,
      mode: "pill",
    };
  }
  if (key.endsWith("-network-error")) {
    return {
      priority: 2,
      // Override to one specific route on creation.
      allowedRoutes: null,
      durationMs: null,
      mode: "pill",
    };
  }
  return null;
}

/**
 * Returns default archetype settings for exact and dynamic key families.
 */
export function getToastArchetypeForKey(key: string): ToastArchetype | null {
  const exact = TOAST_ARCHETYPE[key];
  if (exact != null) return exact;

  if (key.startsWith("dev-")) {
    return {
      priority: 0,
      // Override on creation for per-screen dev overlays if needed.
      allowedRoutes: null,
      durationMs: null,
      mode: "pill",
    };
  }

  const errorFamily = archetypeForErrorFamily(key);
  if (errorFamily != null) return errorFamily;

  if (key.startsWith("search-")) {
    return {
      priority: 3,
      allowedRoutes: ["/explore/search"],
      durationMs: null,
      mode: "pill",
    };
  }

  if (key.startsWith(`${TOAST_KEY_DOWNLOAD_PROGRESS}-`)) {
    return {
      priority: 3,
      // Override to one specific page id on creation; allow explore + saved variants of that page.
      allowedRoutes: ["/explore/[id]/page", "/saved/[id]/page"],
      durationMs: 3000,
      mode: "progress",
    };
  }

  if (key.endsWith("-network-slow")) {
    return {
      priority: 2,
      // Override to one specific route on creation.
      allowedRoutes: null,
      durationMs: null,
      mode: "pill",
    };
  }

  return null;
}

export function toastStackPriorityForKey(key: string): number {
  const archetype = getToastArchetypeForKey(key);
  if (archetype != null) return archetype.priority;
  return Number.POSITIVE_INFINITY;
}
