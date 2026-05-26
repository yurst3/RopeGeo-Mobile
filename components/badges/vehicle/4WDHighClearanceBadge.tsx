import { RopewikiVehicleType } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/ColorThemeContext";

export function FourWDHighClearanceBadge({
  showLabel,
}: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.vehicle[RopewikiVehicleType.fourWdHighClearance];
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/vehicle/4WDHighClearance.png")}
      backgroundColor={background}
      iconColor={icon}
      label={showLabel ? "4WD High Clearance" : undefined}
    />
  );
}
