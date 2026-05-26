import { RopewikiVehicleType } from "ropegeo-common/models";

import type { VehicleBadgeColors } from "../../types";

const DEFAULT_ICON = "#000000";

const greenBackground = "#22c55e";
const yellowBackground = "#eab308";
const orangeBackground = "#f97316";
const redBackground = "#ef4444";

export const vehicleBadges: Record<RopewikiVehicleType, VehicleBadgeColors> = {
  [RopewikiVehicleType.passenger]: {
    background: greenBackground,
    icon: DEFAULT_ICON,
  },
  [RopewikiVehicleType.highClearance]: {
    background: orangeBackground,
    icon: DEFAULT_ICON,
  },
  [RopewikiVehicleType.fourWd]: {
    background: yellowBackground,
    icon: DEFAULT_ICON,
  },
  [RopewikiVehicleType.fourWdHighClearance]: {
    background: redBackground,
    icon: DEFAULT_ICON,
  },
  [RopewikiVehicleType.fourWdVeryHighClearance]: {
    background: redBackground,
    icon: DEFAULT_ICON,
  },
};
