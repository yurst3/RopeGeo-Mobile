import { RouteType } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/theme/ColorThemeContext";


export function CaveBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.routeType[RouteType.Cave];

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/route/cave.png")}
      backgroundColor={background}
      iconColor={icon}
      label={showLabel ? "Cave" : undefined}
    />
  );
}
