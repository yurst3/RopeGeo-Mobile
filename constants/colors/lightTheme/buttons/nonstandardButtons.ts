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
const progressSolid = "#0f172a";
const shadowColor = "#000000";

const downloadButton: DownloadButtonColors = {
  background: "rgba(255,255,255,0.95)",
  downloadCompleteBackground,
  icon: progressSolid,
  downloadCompleteIcon,
  inProgressBackground: "rgba(15,23,42,0.25)",
  inProgressSolid: progressSolid,
  shadowColor,
};

const miniDownloadButton: MiniDownloadButtonColors = {
  background: "rgba(255,255,255,0.92)",
  downloadCompleteBackground,
  icon: progressSolid,
  downloadCompleteIcon,
  inProgressBackground: "rgba(15,23,42,0.2)",
  inProgressSolid: progressSolid,
  inProgress: progressSolid,
  shadowColor,
};

const badgeButton: BadgeButtonColors = {
  infoIconBackground: "#3b82f6",
  infoIcon: "#ffffff",
};

const logoutButton: LogoutButtonColors = {
  background: "#ffffff",
  text: "#dc2626",
  shadowColor,
};

const addRelevantPageButton: AddRelevantPageButtonColors = {
  outline: "#9ca3af",
  text: "#4b5563",
  icon: "#4b5563",
};

const addBlockButton: AddBlockButtonColors = {
  outline: "#9ca3af",
  text: "#4b5563",
  icon: "#4b5563",
};

const confirmRemoveButton: ConfirmRemoveButtonColors = {
  background: "#dc2626",
  text: "#ffffff",
};

const recordLineSegmentButton: RecordLineSegmentButtonColors = {
  background: "#ffffff",
  text: "#000000",
  indicator: "#dc2626",
  pauseIcon: "#000000",
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
