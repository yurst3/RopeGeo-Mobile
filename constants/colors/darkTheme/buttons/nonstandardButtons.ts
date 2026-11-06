import {
  ADD_BLOCK_BUTTON_KEY,
  ADD_RELEVANT_PAGE_BUTTON_KEY,
  BADGE_BUTTON_KEY,
  CONFIRM_REMOVE_BUTTON_KEY,
  DELETE_TRIP_REPORT_BUTTON_KEY,
  DOWNLOAD_BUTTON_KEY,
  LOGOUT_BUTTON_KEY,
  MINI_DOWNLOAD_BUTTON_KEY,
  RECORD_LINE_SEGMENT_BUTTON_KEY,
} from "@/constants/buttons";

import type {
  AddBlockButtonColors,
  AddRelevantPageButtonColors,
  BadgeButtonColors,
  ConfirmRemoveButtonColors,
  DeleteTripReportButtonColors,
  DownloadButtonColors,
  LogoutButtonColors,
  MiniDownloadButtonColors,
  NonstandardButtonKeys,
  RecordLineSegmentButtonColors,
} from "../../types";

const downloadCompleteBackground = "#15803d";
const downloadCompleteIcon = "#ffffff";
const idleIcon = "#ffffff";
const shadowColor = "#ffffff";

const downloadButton: DownloadButtonColors = {
  background: "#000000",
  downloadCompleteBackground,
  icon: idleIcon,
  downloadCompleteIcon,
  inProgressBackground: "rgba(255,255,255,0.25)",
  inProgressSolid: idleIcon,
  shadowColor,
};

const miniDownloadButton: MiniDownloadButtonColors = {
  background: "#000000",
  downloadCompleteBackground,
  icon: idleIcon,
  downloadCompleteIcon,
  inProgressBackground: "rgba(255,255,255,0.2)",
  inProgressSolid: idleIcon,
  inProgress: idleIcon,
  shadowColor,
};

const badgeButton: BadgeButtonColors = {
  infoIconBackground: "#3b82f6",
  infoIcon: "#ffffff",
};

const logoutButton: LogoutButtonColors = {
  background: "#000000",
  text: "#f87171",
  shadowColor,
};

const addRelevantPageButton: AddRelevantPageButtonColors = {
  outline: "#6b7280",
  text: "#d1d5db",
  icon: "#d1d5db",
};

const addBlockButton: AddBlockButtonColors = {
  outline: "#6b7280",
  text: "#d1d5db",
  icon: "#d1d5db",
};

const confirmRemoveButton: ConfirmRemoveButtonColors = {
  background: "#dc2626",
  text: "#ffffff",
};

const recordLineSegmentButton: RecordLineSegmentButtonColors = {
  background: "#000000",
  text: "#ffffff",
  indicator: "#ef4444",
  pauseIcon: "#ffffff",
  shadowColor,
};

const deleteTripReportButton: DeleteTripReportButtonColors = {
  background: "#dc2626",
  text: "#ffffff",
  icon: "#ffffff",
  shadowColor,
};

export const nonstandardButtons: Record<
  NonstandardButtonKeys,
  | DownloadButtonColors
  | MiniDownloadButtonColors
  | BadgeButtonColors
  | LogoutButtonColors
  | AddRelevantPageButtonColors
  | AddBlockButtonColors
  | ConfirmRemoveButtonColors
  | RecordLineSegmentButtonColors
  | DeleteTripReportButtonColors
> = {
  [DOWNLOAD_BUTTON_KEY]: downloadButton,
  [MINI_DOWNLOAD_BUTTON_KEY]: miniDownloadButton,
  [BADGE_BUTTON_KEY]: badgeButton,
  [LOGOUT_BUTTON_KEY]: logoutButton,
  [ADD_RELEVANT_PAGE_BUTTON_KEY]: addRelevantPageButton,
  [ADD_BLOCK_BUTTON_KEY]: addBlockButton,
  [CONFIRM_REMOVE_BUTTON_KEY]: confirmRemoveButton,
  [RECORD_LINE_SEGMENT_BUTTON_KEY]: recordLineSegmentButton,
  [DELETE_TRIP_REPORT_BUTTON_KEY]: deleteTripReportButton,
};
