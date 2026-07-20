/**
 * Ropewiki Creative Commons attribution copy shown on page footers.
 * Deed: https://creativecommons.org/licenses/by-nc-sa/3.0/
 */

export const ROPEWIKI_CC_LICENSE_URI =
  "http://creativecommons.org/licenses/by-nc-sa/3.0/";

export const ROPEWIKI_CC_LICENSE_SHORT_NAME = "CC BY-NC-SA 3.0";

export const ROPEWIKI_ATTRIBUTION_COURTESY_PREFIX =
  "This information is provided courtesy of ";

export const ROPEWIKI_ATTRIBUTION_COURTESY_LINK_LABEL = "ropewiki.com";

export const ROPEWIKI_ATTRIBUTION_COURTESY_SUFFIX =
  ". Please consider supporting Ropewiki by contributing information, trip reports, reference photos, or rating the original page.";

/** Full courtesy sentence (for tests / plain-text contexts). */
export const ROPEWIKI_ATTRIBUTION_COURTESY =
  `${ROPEWIKI_ATTRIBUTION_COURTESY_PREFIX}${ROPEWIKI_ATTRIBUTION_COURTESY_LINK_LABEL}${ROPEWIKI_ATTRIBUTION_COURTESY_SUFFIX}`;

export const ROPEWIKI_ATTRIBUTION_LICENSE_PREFIX = "Licensed under ";

export const ROPEWIKI_MAP_AUTHORS_PREFIX = "Original map data authored by ";

/** Shared trailing credit for known page/map authors. */
export const ROPEWIKI_AUTHORS_MODIFIED_SUFFIX =
  ". Modified for use in RopeGeo by Ethan Hurst.";

export const ROPEWIKI_MAP_AUTHORS_UNKNOWN =
  "Original map data by unknown author.";

export const ROPEWIKI_IMAGE_AUTHORS_PREFIX = "Image authored by ";

export const ROPEWIKI_IMAGE_AUTHORS_UNKNOWN = "Image created by unknown author";

export const ROPEWIKI_BANNER_IMAGE_AUTHORS_PREFIX = "Banner image authored by ";

export const ROPEWIKI_BANNER_IMAGE_AUTHORS_UNKNOWN =
  "Banner image created by unknown author";

export const ROPEWIKI_PAGE_AUTHORS_PREFIX = "Information authored by ";

export const ROPEWIKI_PAGE_AUTHORS_UNKNOWN =
  "Information created by unknown author.";

/**
 * Format a non-empty authors list for display.
 * One name: "Alice". Two: "Alice and Bob". Three+: "Alice, Bob, and Carol".
 */
export function formatAttributionAuthors(authors: string[]): string {
  if (authors.length === 1) {
    return authors[0]!;
  }
  if (authors.length === 2) {
    return `${authors[0]} and ${authors[1]}`;
  }
  return `${authors.slice(0, -1).join(", ")}, and ${authors[authors.length - 1]}`;
}

export function formatPageAuthors(
  authors: string[] | null | undefined,
): string {
  if (!hasDisplayableAuthors(authors)) {
    return ROPEWIKI_PAGE_AUTHORS_UNKNOWN;
  }
  return `${ROPEWIKI_PAGE_AUTHORS_PREFIX}${formatAttributionAuthors(authors)}${ROPEWIKI_AUTHORS_MODIFIED_SUFFIX}`;
}

export function formatMapDataAuthors(
  authors: string[] | null | undefined,
): string {
  if (!hasDisplayableAuthors(authors)) {
    return ROPEWIKI_MAP_AUTHORS_UNKNOWN;
  }
  return `${ROPEWIKI_MAP_AUTHORS_PREFIX}${formatAttributionAuthors(authors)}${ROPEWIKI_AUTHORS_MODIFIED_SUFFIX}`;
}

export function formatImageAuthors(
  authors: string[] | null | undefined,
): string {
  if (!hasDisplayableAuthors(authors)) {
    return ROPEWIKI_IMAGE_AUTHORS_UNKNOWN;
  }
  return `${ROPEWIKI_IMAGE_AUTHORS_PREFIX}${formatAttributionAuthors(authors)}`;
}

export function formatBannerImageAuthors(
  authors: string[] | null | undefined,
): string {
  if (!hasDisplayableAuthors(authors)) {
    return ROPEWIKI_BANNER_IMAGE_AUTHORS_UNKNOWN;
  }
  return `${ROPEWIKI_BANNER_IMAGE_AUTHORS_PREFIX}${formatAttributionAuthors(authors)}`;
}

/** True when authors should be shown in the UI. */
export function hasDisplayableAuthors(
  authors: string[] | null | undefined,
): authors is string[] {
  return authors != null && authors.length > 0;
}
