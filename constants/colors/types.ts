import type {
  AcaRiskSubRating,
  AcaTechnicalSubRating,
  AcaTimeSubRating,
  AcaWaterSubRating,
  DifficultyRatingSystem,
  PermitStatus,
  RelevanceStrength,
  RopewikiVehicleType,
  RouteType,
} from "ropegeo-common/models";

export type StandardButtonKeys =
  | "back"
  | "filter"
  | "mapLayers"
  | "settings"
  | "edit"
  | "save"
  | "share"
  | "externalLink"
  | "expandMiniMap"
  | "appleDirections"
  | "googleDirections"
  | "resetCameraToBounds"
  | "resetCameraToPosition"
  | "resetCameraOrientation"
  | "savedPageGlyph"
  | "removeDownload"
  | "addTripReport"
  | "viewEdit"
  | "addLineSegment"
  | "miniRecordLineSegment";

export type NonstandardButtonKeys =
  | "download"
  | "miniDownload"
  | "badgeButton"
  | "logout"
  | "addRelevantPage"
  | "addBlock"
  | "confirmRemove"
  | "recordLineSegment"
  | "deleteTripReport";

export type StandardButtonColors = {
  background: string;
  icon: string;
  iconHighlight?: string;
  border?: string;
};

export type DownloadButtonColors = {
  background: string;
  downloadCompleteBackground: string;
  icon: string;
  downloadCompleteIcon: string;
  inProgressBackground: string;
  inProgressSolid: string;
  shadowColor: string;
};

export type MiniDownloadButtonColors = {
  background: string;
  downloadCompleteBackground: string;
  icon: string;
  downloadCompleteIcon: string;
  inProgressBackground: string;
  inProgressSolid: string;
  inProgress: string;
  shadowColor: string;
};

export type BadgeButtonColors = {
  infoIconBackground: string;
  infoIcon: string;
};

export type LogoutButtonColors = {
  background: string;
  text: string;
  shadowColor: string;
};

export type AddRelevantPageButtonColors = {
  outline: string;
  text: string;
  icon: string;
};

export type AddBlockButtonColors = {
  outline: string;
  text: string;
  icon: string;
};

/** Filled button that confirms removing something. */
export type ConfirmRemoveButtonColors = {
  background: string;
  text: string;
};

export type RecordLineSegmentButtonColors = {
  background: string;
  text: string;
  /** Record icon, and the pulsing border around a map that is recording. */
  indicator: string;
  /** Pause icon shown while recording. */
  pauseIcon: string;
  shadowColor: string;
};

/** Filled pill that deletes a whole trip report. */
export type DeleteTripReportButtonColors = {
  background: string;
  text: string;
  icon: string;
  shadowColor: string;
};

export type NonstandardButtonColors =
  | DownloadButtonColors
  | MiniDownloadButtonColors
  | BadgeButtonColors
  | LogoutButtonColors
  | AddRelevantPageButtonColors
  | AddBlockButtonColors
  | ConfirmRemoveButtonColors
  | RecordLineSegmentButtonColors
  | DeleteTripReportButtonColors;

export type ButtonColors = {
  standard: Record<StandardButtonKeys, StandardButtonColors>;
  nonstandard: Record<NonstandardButtonKeys, NonstandardButtonColors>;
  shadowColor: string;
};

export type DifficultySubRating =
  | AcaTechnicalSubRating
  | AcaWaterSubRating
  | AcaTimeSubRating
  | AcaRiskSubRating;

export type DifficultyRatingBadgeColors = {
  background: string;
  icon: string;
};

export type RouteTypeBadgeColors = {
  background: string;
  icon: string;
};

export type PermitBadgeColors = {
  background: string;
  icon: string;
};

export type ShuttleBadgeKeys = "noShuttle" | "shuttleRequired";

export type ShuttleBadgeColors = {
  background: string;
  icon: string;
};

export type VehicleBadgeColors = {
  background: string;
  icon: string;
};

export type UnknownBadgeColors = {
  background: string;
  icon: string;
};

export type SubBadgeColors = {
  background: string;
  icon: string;
};

/** Monochrome icon plate for profile achievement badges. */
export type ProfileIconBadgeColors = {
  background: string;
  icon: string;
};

export type RelevanceStrengthBadgeColors = {
  background: string;
  icon: string;
};

export type BadgeColors = {
  difficultyRating: Record<
    DifficultyRatingSystem,
    Record<DifficultySubRating, DifficultyRatingBadgeColors>
  >;
  routeType: Record<RouteType, RouteTypeBadgeColors>;
  permit: Record<PermitStatus, PermitBadgeColors>;
  shuttle: Record<ShuttleBadgeKeys, ShuttleBadgeColors>;
  vehicle: Record<RopewikiVehicleType, VehicleBadgeColors>;
  relevanceStrength: Record<RelevanceStrength, RelevanceStrengthBadgeColors>;
  unknown: UnknownBadgeColors;
  placeholder: string;
  subBadge: SubBadgeColors;
  border: string;
  profileIcon: ProfileIconBadgeColors;
};

export type TextColors = {
  primary: string;
  secondary: string;
  tertiary: string;
  link: string;
  error: string;
  /** Yellow accent for small supporting notes (e.g. supported file formats). */
  highlight: string;
};

export type MarkerColors = {
  defaultIcon: string;
  clusterIcon: string;
  /** Outline around marker icons, inverted from the icon color so markers stand out on lines. */
  iconHalo: string;
  text: string;
  textHalo: string;
};

export type SearchBarColors = {
  background: string;
  shadow: string;
  icon: string;
};

export type MiniMapTitleColors = {
  background: string;
  shadow: string;
};

export type MiniMapLegendColors = {
  bodyBackground: string;
  headerBackground: string;
  shadow: string;
  collapseIcon: string;
  /** Tint used only for point marker icons inside the legend swatches. */
  markerIcon: string;
};

/** Chrome around user-recorded line segments; the line and dot fill use the segment's color. */
export type RecordedSegmentColors = {
  /** Outline around each waypoint dot. */
  waypointStroke: string;
  /** Thin outline under the line so it stays visible on any basemap. */
  lineCasing: string;
  /**
   * Replaces {@link lineCasing} and {@link waypointStroke} for light segment colors (white,
   * yellow, green), which those don't stand out against.
   */
  lightLineOutline: string;
};

export type MiniMapColors = {
  /** Full-bleed mount/handoff loading cover behind chrome. */
  background: string;
  title: MiniMapTitleColors;
  legend: MiniMapLegendColors;
  recordedSegment: RecordedSegmentColors;
};

export type MapColors = {
  minimap: MiniMapColors;
};

export type TabBarColors = {
  background: string;
  iconUnfocused: string;
  iconFocused: string;
  /** Saved-tab “page saved” halo (not the tab icon tint). */
  iconHighlight: string;
};

export type ImageColors = {
  textBackground: string;
  text: string;
  missingIcon: string;
  missingText: string;
  background: string;
  /** Tint over blurred banners (darken in dark theme, brighten in light). */
  blurOverlay: string;
  /** Darkening scrim over a profile photo while editing. */
  profileEditScrim: string;
  /** Edit-photo icon tint while editing. */
  profileEditIcon: string;
  /** Display-name field fill while editing (lifted from the page background). */
  profileDisplayNameBackground: string;
  /** Display-name field outline while editing. */
  profileDisplayNameOutline: string;
  /** Display-name field fill when the draft is empty. */
  profileDisplayNameErrorBackground: string;
  /** Display-name field outline when the draft is empty. */
  profileDisplayNameErrorOutline: string;
};

export type ToastStyle = "success" | "error" | "warning" | "info";

export type ToastColors = {
  background: string;
  text: string;
  filledTrack: string;
  unfilledTrack: string;
  icon: string;
};

export type PagePreviewColors = {
  sourceIconBackground: string;
  /** Dashed circle on an unselected selectable preview. */
  selectionOutline: string;
  /** Filled circle on a selected preview. */
  selectionFill: string;
  /** Checkmark inside the selected circle. */
  selectionCheck: string;
};

export type RegionPreviewColors = {
  regionIconBackground: string;
  regionIcon: string;
  shadowColor: string;
  sourceIconBackground: string;
};

export type PreviewColors = {
  page: PagePreviewColors;
  region: RegionPreviewColors;
};

export type FilterCheckboxColors = {
  uncheckedOutline: string;
  checkedOutline: string;
  checkedFill: string;
};

export type FilterRadioButtonColors = {
  uncheckedOutline: string;
  checkedFill: string;
};

export type FilterSwitchColors = {
  onBackground: string;
  offBackground: string;
  thumb: string;
};

export type FilterSliderColors = {
  filledBar: string;
  unfilledBar: string;
  thumb: string;
};

export type FilterDropdownColors = {
  outline: string;
  modalBackground: string;
};

export type FilterBadgeSliderColors = {
  filledBar: string;
  unfilledBar: string;
  tick: string;
};

export type FilterColors = {
  checkbox: FilterCheckboxColors;
  radioButton: FilterRadioButtonColors;
  switch: FilterSwitchColors;
  slider: FilterSliderColors;
  dropdown: FilterDropdownColors;
  badgeSlider: FilterBadgeSliderColors;
  disableSection: string;
  noteText: string;
  revertText: string;
};

export type ThemeColors = {
  background: string;
  cardHighlight: string;
  placeholder: string;
  separator: string;
  starRating: string;
  loadingIndicator: string;
  button: ButtonColors;
  badge: BadgeColors;
  text: TextColors;
  image: ImageColors;
  preview: PreviewColors;
  filter: FilterColors;
  tabBar: TabBarColors;
  map: MapColors;
  searchBar: SearchBarColors;
  toast: Record<ToastStyle, ToastColors>;
};
