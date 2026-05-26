import {
  BADGE_BUTTON_KEY,
  DOWNLOAD_BUTTON_KEY,
  MINI_DOWNLOAD_BUTTON_KEY,
} from "@/constants/buttons";

import type {
  BadgeButtonColors,
  DownloadButtonColors,
  MiniDownloadButtonColors,
  NonstandardButtonKeys,
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

export const nonstandardButtons: Record<
  NonstandardButtonKeys,
  DownloadButtonColors | MiniDownloadButtonColors | BadgeButtonColors
> = {
  [DOWNLOAD_BUTTON_KEY]: downloadButton,
  [MINI_DOWNLOAD_BUTTON_KEY]: miniDownloadButton,
  [BADGE_BUTTON_KEY]: badgeButton,
};
