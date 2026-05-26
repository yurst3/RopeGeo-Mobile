import { RouteType } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/ColorThemeContext";


export function PoiBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.routeType[RouteType.POI];

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/route/poi.png")}
      backgroundColor={background}
      iconColor={icon}
      label={showLabel ? "POI" : undefined}
    />
  );
}
