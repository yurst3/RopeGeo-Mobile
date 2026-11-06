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
const idleIcon = "#FF6EC7";
const shadowColor = "#FACC15";

const downloadButton: DownloadButtonColors = {
  background: "#3B0764",
  downloadCompleteBackground,
  icon: idleIcon,
  downloadCompleteIcon,
  inProgressBackground: "rgba(250, 204, 21, 0.25)",
  inProgressSolid: idleIcon,
  shadowColor,
};

const miniDownloadButton: MiniDownloadButtonColors = {
  background: "#3B0764",
  downloadCompleteBackground,
  icon: idleIcon,
  downloadCompleteIcon,
  inProgressBackground: "rgba(250, 204, 21, 0.2)",
  inProgressSolid: idleIcon,
  inProgress: idleIcon,
  shadowColor,
};

const badgeButton: BadgeButtonColors = {
  infoIconBackground: "#3b82f6",
  infoIcon: "#ffffff",
};

const logoutButton: LogoutButtonColors = {
  background: "#3B0764",
  text: "#fb7185",
  shadowColor,
};

const addRelevantPageButton: AddRelevantPageButtonColors = {
  outline: "#C4B5FD",
  text: "#FF9AD9",
  icon: "#FF9AD9",
};

const addBlockButton: AddBlockButtonColors = {
  outline: "#C4B5FD",
  text: "#FF9AD9",
  icon: "#FF9AD9",
};

const confirmRemoveButton: ConfirmRemoveButtonColors = {
  background: "#dc2626",
  text: "#ffffff",
};

const recordLineSegmentButton: RecordLineSegmentButtonColors = {
  background: "#3B0764",
  text: "#FF6EC7",
  indicator: "#ef4444",
  pauseIcon: "#FF6EC7",
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
