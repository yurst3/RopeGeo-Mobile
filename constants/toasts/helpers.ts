import type { ToastStyle } from "@/constants/colors/types";

import {
  TOAST_ARCHETYPE,
  TOAST_KEY_DOWNLOAD_CANCELLED,
  TOAST_KEY_DOWNLOAD_PROGRESS,
  TOAST_KEY_INVALID_STORED_DOWNLOAD_JOB,
} from "./toastArchetypes";
import type { ProgressToastKind, ToastArchetype } from "./types";

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

/** Builds a normalized route from expo-router segments (strips route-group segments). */
export function routePathFromSegments(segments: string[]): string {
  const parts = segments.filter((segment) => !/^\(.+\)$/.test(segment));
  if (parts.length === 0) return "/";
  return normalizeRoutePath(`/${parts.join("/")}`);
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
      allowedRoutes: null,
      durationMs: null,
      variant: "pill",
      style: "error",
    };
  }
  if (key.endsWith("-network-error")) {
    return {
      priority: 2,
      allowedRoutes: null,
      durationMs: null,
      variant: "pill",
      style: "error",
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
      allowedRoutes: null,
      durationMs: null,
      variant: "pill",
      style: "info",
    };
  }

  const errorFamily = archetypeForErrorFamily(key);
  if (errorFamily != null) return errorFamily;

  if (key.startsWith("search-")) {
    return {
      priority: 3,
      allowedRoutes: ["/explore/search"],
      durationMs: null,
      variant: "pill",
      style: "warning",
    };
  }

  if (key.startsWith(`${TOAST_KEY_DOWNLOAD_PROGRESS}-`)) {
    return {
      priority: 3,
      allowedRoutes: ["/explore/[id]/page", "/saved/[id]/page"],
      durationMs: 3000,
      variant: "progress",
      style: "warning",
    };
  }

  if (key.startsWith(`${TOAST_KEY_DOWNLOAD_CANCELLED}-`)) {
    return {
      priority: 3,
      allowedRoutes: ["/explore/[id]/page", "/saved/[id]/page"],
      durationMs: 5000,
      variant: "pill",
      style: "error",
    };
  }

  if (key.startsWith(`${TOAST_KEY_INVALID_STORED_DOWNLOAD_JOB}-`)) {
    return {
      priority: 2,
      allowedRoutes: ["/saved/[id]/page"],
      durationMs: 5000,
      variant: "pill",
      style: "error",
    };
  }

  if (key.endsWith("-network-slow")) {
    return {
      priority: 2,
      allowedRoutes: null,
      durationMs: null,
      variant: "pill",
      style: "warning",
    };
  }

  return null;
}

export function toastStackPriorityForKey(key: string): number {
  const archetype = getToastArchetypeForKey(key);
  if (archetype != null) return archetype.priority;
  return Number.POSITIVE_INFINITY;
}

export function toastStyleForProgressKind(kind: ProgressToastKind): ToastStyle {
  switch (kind) {
    case "progress":
      return "warning";
    case "success":
      return "success";
    case "error":
      return "error";
  }
}

export function resolveToastStyle(
  key: string,
  overrides?: { style?: ToastStyle; progressKind?: ProgressToastKind },
): ToastStyle {
  if (overrides?.progressKind != null) {
    return toastStyleForProgressKind(overrides.progressKind);
  }
  if (overrides?.style != null) {
    return overrides.style;
  }
  return getToastArchetypeForKey(key)?.style ?? "warning";
}
