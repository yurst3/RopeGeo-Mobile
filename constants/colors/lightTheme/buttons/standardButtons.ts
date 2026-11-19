import {
  BACK_BUTTON_KEY,
  UNDO_BUTTON_KEY,
  APPLE_DIRECTIONS_BUTTON_KEY,
  EXPAND_MINI_MAP_BUTTON_KEY,
  EXTERNAL_LINK_BUTTON_KEY,
  GOOGLE_DIRECTIONS_BUTTON_KEY,
  MAP_LAYERS_BUTTON_KEY,
  FILTER_BUTTON_KEY,
  SETTINGS_BUTTON_KEY,
  EDIT_BUTTON_KEY,
  RESET_CAMERA_ORIENTATION_BUTTON_KEY,
  RESET_CAMERA_TO_BOUNDS_BUTTON_KEY,
  RESET_CAMERA_TO_POSITION_BUTTON_KEY,
  REMOVE_DOWNLOAD_BUTTON_KEY,
  SAVE_BUTTON_KEY,
  SAVED_PAGE_GLYPH_KEY,
  SHARE_BUTTON_KEY,
  ADD_TRIP_REPORT_BUTTON_KEY,
  VIEW_EDIT_BUTTON_KEY,
  ADD_LINE_SEGMENT_BUTTON_KEY,
  ADD_MARKER_BUTTON_KEY,
  RECORD_LINE_SEGMENT_BUTTON_KEY,
  RECORD_SETTINGS_BUTTON_KEY,
  ADD_MID_WAYPOINT_BUTTON_KEY,
  ADD_END_WAYPOINT_BUTTON_KEY,
  REMOVE_WAYPOINT_BUTTON_KEY,
  SPLIT_SEGMENT_BUTTON_KEY,
  LAYERED_ICON_ACCENT_ADD,
  LAYERED_ICON_ACCENT_REMOVE,
} from "@/constants/buttons";

import type { StandardButtonColors, StandardButtonKeys } from "../../types";

const whiteBackground = "#ffffff";
const defaultIcon = "#000000";
const iconHighlight = "#dc732b";
const defaultStandard: StandardButtonColors = {
  background: whiteBackground,
  icon: defaultIcon,
};

const highlightedStandard: StandardButtonColors = {
  background: whiteBackground,
  icon: defaultIcon,
  iconHighlight,
};

const layeredAddStandard: StandardButtonColors = {
  background: whiteBackground,
  icon: defaultIcon,
  iconAccent: LAYERED_ICON_ACCENT_ADD,
};

const layeredRemoveStandard: StandardButtonColors = {
  background: whiteBackground,
  icon: defaultIcon,
  iconAccent: LAYERED_ICON_ACCENT_REMOVE,
};

export const standardButtons: Record<StandardButtonKeys, StandardButtonColors> = {
  [BACK_BUTTON_KEY]: defaultStandard,
  [UNDO_BUTTON_KEY]: defaultStandard,
  [FILTER_BUTTON_KEY]: highlightedStandard,
  [MAP_LAYERS_BUTTON_KEY]: highlightedStandard,
  [SETTINGS_BUTTON_KEY]: defaultStandard,
  [EDIT_BUTTON_KEY]: highlightedStandard,
  [SAVE_BUTTON_KEY]: highlightedStandard,
  [SHARE_BUTTON_KEY]: defaultStandard,
  [EXTERNAL_LINK_BUTTON_KEY]: defaultStandard,
  [EXPAND_MINI_MAP_BUTTON_KEY]: defaultStandard,
  [APPLE_DIRECTIONS_BUTTON_KEY]: defaultStandard,
  [GOOGLE_DIRECTIONS_BUTTON_KEY]: defaultStandard,
  [RESET_CAMERA_TO_BOUNDS_BUTTON_KEY]: defaultStandard,
  [RESET_CAMERA_TO_POSITION_BUTTON_KEY]: {
    background: whiteBackground,
    icon: "#333333",
  },
  [RESET_CAMERA_ORIENTATION_BUTTON_KEY]: defaultStandard,
  [SAVED_PAGE_GLYPH_KEY]: highlightedStandard,
  [REMOVE_DOWNLOAD_BUTTON_KEY]: defaultStandard,
  [ADD_TRIP_REPORT_BUTTON_KEY]: defaultStandard,
  [VIEW_EDIT_BUTTON_KEY]: defaultStandard,
  [ADD_LINE_SEGMENT_BUTTON_KEY]: layeredAddStandard,
  [ADD_MARKER_BUTTON_KEY]: layeredAddStandard,
  [RECORD_LINE_SEGMENT_BUTTON_KEY]: defaultStandard,
  [RECORD_SETTINGS_BUTTON_KEY]: defaultStandard,
  [ADD_MID_WAYPOINT_BUTTON_KEY]: layeredAddStandard,
  [ADD_END_WAYPOINT_BUTTON_KEY]: layeredAddStandard,
  [REMOVE_WAYPOINT_BUTTON_KEY]: layeredRemoveStandard,
  [SPLIT_SEGMENT_BUTTON_KEY]: layeredAddStandard,
};
