import { RouteType } from "ropegeo-common/models";

import type { RouteTypeBadgeColors } from "../../types";

const DEFAULT_ICON = "#ffffff";

export const routeTypeBadges: Record<RouteType, RouteTypeBadgeColors> = {
  [RouteType.Canyon]: {
    background: "#b45309",
    icon: DEFAULT_ICON,
  },
  [RouteType.Cave]: {
    background: "#78716c",
    icon: DEFAULT_ICON,
  },
  [RouteType.POI]: {
    background: "#1d4ed8",
    icon: DEFAULT_ICON,
  },
  [RouteType.Unknown]: {
    background: "#6b7280",
    icon: DEFAULT_ICON,
  },
};
