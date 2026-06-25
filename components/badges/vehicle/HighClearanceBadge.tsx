import { RopewikiVehicleType } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/theme/ColorThemeContext";

export function HighClearanceBadge({
  showLabel,
}: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.vehicle[RopewikiVehicleType.highClearance];
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/vehicle/highClearance.png")}
      backgroundColor={background}
      iconColor={icon}
      label={showLabel ? "High Clearance" : undefined}
    />
  );
}
