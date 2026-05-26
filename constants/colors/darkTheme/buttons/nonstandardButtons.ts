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

export const nonstandardButtons: Record<
  NonstandardButtonKeys,
  DownloadButtonColors | MiniDownloadButtonColors | BadgeButtonColors
> = {
  [DOWNLOAD_BUTTON_KEY]: downloadButton,
  [MINI_DOWNLOAD_BUTTON_KEY]: miniDownloadButton,
  [BADGE_BUTTON_KEY]: badgeButton,
};
