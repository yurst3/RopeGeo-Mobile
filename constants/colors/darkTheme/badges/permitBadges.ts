import { PermitStatus } from "ropegeo-common/models";

import type { PermitBadgeColors } from "../../types";

const DEFAULT_ICON = "#ffffff";

const greenBackground = "#166534";
const redBackground = "#b91c1c";

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
