/**
 * Shared layout constants for full-screen map UIs (Explore, region/page map screens).
 * Matches ExploreScreen header row height and floating map control positions.
 */
export const HEADER_BUTTON_SIZE = 44;
/** Gap between search bar and filter (Explore) and related header spacing. */
export const HEADER_BUTTON_GAP = 8;
/** Left/right header chrome width (explore: search side / filter slot). */
export const HEADER_SIDE_SLOT_WIDTH = HEADER_BUTTON_SIZE + HEADER_BUTTON_GAP;

export const MAP_BUTTON_TOP_OFFSET = 8 + HEADER_BUTTON_SIZE + 8;
export const MAP_BUTTON_SIZE = 48;
export const MAP_BUTTON_GAP = 8;

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
