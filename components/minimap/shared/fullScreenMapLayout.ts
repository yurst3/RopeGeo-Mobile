/**
 * Shared layout constants for full-screen map UIs (Explore, region/page map screens).
 * Base sizes at medium profile — multiply by resolved button `background` scale in layout code
 * (see {@link resolveHeaderChromeLayout} and {@link resolveMapButtonChromeLayout}).
 */
export const HEADER_BUTTON_SIZE = 44;
/** Base gap between search bar and filter (Explore) and related header spacing. */
export const HEADER_BUTTON_GAP = 8;
/** Base left/right header chrome width (explore: search side / filter slot). */
export const HEADER_SIDE_SLOT_WIDTH = HEADER_BUTTON_SIZE + HEADER_BUTTON_GAP;

/** Base distance from safe-area top to the expanded minimap header row. */
export const MAP_HEADER_ROW_TOP_INSET = 8;

/** Base top offset for the first stacked map control when a header-row action sits above the stack. */
export const MAP_BUTTON_TOP_OFFSET = MAP_HEADER_ROW_TOP_INSET + HEADER_BUTTON_SIZE + 8;
export const MAP_BUTTON_SIZE = 48;
export const MAP_BUTTON_GAP = 8;

/**
 * Expanded minimap stack top. When the bounds-reset control is in the header, the stack sits
 * below the header row; when it is hidden, the stack moves up to the header row unless another
 * header-row action (e.g. region filter) stays on the right.
 */
export function expandedMiniMapButtonStackTop(
  safeTop: number,
  boundsResetButtonVisible: boolean,
  options?: { otherHeaderRowActionVisible?: boolean },
): number {
  const shiftUpWhenBoundsHidden =
    !boundsResetButtonVisible && !options?.otherHeaderRowActionVisible;
  return (
    safeTop +
    (shiftUpWhenBoundsHidden ? MAP_HEADER_ROW_TOP_INSET : MAP_BUTTON_TOP_OFFSET)
  );
}

/** Design baseline for stacked toast anchor (use {@link resolveStackedToastBaseOffsetBelowSafeTop}). */
export const STACKED_TOAST_BASE_OFFSET_BELOW_SAFE_TOP = 56 + 8;

export function boundsPaddingForFullScreenMap(insets: {
  top: number;
  bottom: number;
}) {
  return {
    paddingTop: insets.top + MAP_BUTTON_TOP_OFFSET + 24,
    paddingBottom: insets.bottom + 40,
    paddingLeft: 20,
    paddingRight: 20,
  } as const;
}

/**
 * Bottom padding for overlays that cover the full window on tab screens (e.g. docked RoutePreview,
 * floating map legend). Tab screens lay out above the tab bar with `insets.bottom` only; overlays
 * must add the tab bar height.
 */
export function routePreviewDockedPaddingBottom(
  safeBottomInset: number,
  tabBarHeight: number,
  gap: number = 8,
): number {
  return tabBarHeight + safeBottomInset + gap;
}