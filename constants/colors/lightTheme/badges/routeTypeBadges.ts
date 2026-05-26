import { RouteType } from "ropegeo-common/models";

import type { RouteTypeBadgeColors } from "../../types";

const DEFAULT_ICON = "#000000";

export const routeTypeBadges: Record<RouteType, RouteTypeBadgeColors> = {
  [RouteType.Canyon]: {
    background: "#fdba74",
    icon: DEFAULT_ICON,
  },
  [RouteType.Cave]: {
    background: "#d4a574",
    icon: DEFAULT_ICON,
  },
  [RouteType.POI]: {
    background: "#93c5fd",
    icon: DEFAULT_ICON,
  },
  [RouteType.Unknown]: {
    background: "#d1d5db",
    icon: DEFAULT_ICON,
  },
};
