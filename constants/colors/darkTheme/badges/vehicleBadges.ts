import { RopewikiVehicleType } from "ropegeo-common/models";

import type { VehicleBadgeColors } from "../../types";

const DEFAULT_ICON = "#ffffff";

const greenBackground = "#166534";
const yellowBackground = "#ca8a04";
const orangeBackground = "#b45309";
const redBackground = "#b91c1c";

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
