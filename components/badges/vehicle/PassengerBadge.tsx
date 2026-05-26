import { RopewikiVehicleType } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/ColorThemeContext";

export function PassengerBadge({
  showLabel,
}: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.vehicle[RopewikiVehicleType.passenger];
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/vehicle/passenger.png")}
      backgroundColor={background}
      iconColor={icon}
      label={showLabel ? "Passenger" : undefined}
    />
  );
}
