import {
  NO_SHUTTLE_BADGE_KEY,
  SHUTTLE_REQUIRED_BADGE_KEY,
} from "@/constants/badges";

import type { ShuttleBadgeColors, ShuttleBadgeKeys } from "../../types";

const DEFAULT_ICON = "#000000";

const greenBackground = "#22c55e";
const yellowBackground = "#eab308";

export const shuttleBadges = {
  [NO_SHUTTLE_BADGE_KEY]: {
    background: greenBackground,
    icon: DEFAULT_ICON,
  },
  [SHUTTLE_REQUIRED_BADGE_KEY]: {
    background: yellowBackground,
    icon: DEFAULT_ICON,
  },
} satisfies Record<ShuttleBadgeKeys, ShuttleBadgeColors>;
