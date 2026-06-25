import { RouteType } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/theme/ColorThemeContext";


export function CanyonBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.routeType[RouteType.Canyon];

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/route/canyon.png")}
      backgroundColor={background}
      iconColor={icon}
      label={showLabel ? "Canyon" : undefined}
    />
  );
}
