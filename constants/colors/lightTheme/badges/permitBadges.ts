import { PermitStatus } from "ropegeo-common/models";

import type { PermitBadgeColors } from "../../types";

const DEFAULT_ICON = "#000000";

const greenBackground = "#22c55e";
const redBackground = "#ef4444";

export const permitBadges: Record<PermitStatus, PermitBadgeColors> = {
  [PermitStatus.No]: {
    background: greenBackground,
    icon: DEFAULT_ICON,
  },
  [PermitStatus.Yes]: {
    background: redBackground,
    icon: DEFAULT_ICON,
  },
  [PermitStatus.Restricted]: {
    background: redBackground,
    icon: DEFAULT_ICON,
  },
  [PermitStatus.Closed]: {
    background: redBackground,
    icon: DEFAULT_ICON,
  },
};
