import { Badge } from "@/components/badges/Badge";
import { NO_SHUTTLE_BADGE_KEY } from "@/constants/badges";
import { useColorTheme } from "@/context/ColorThemeContext";

export function NoShuttleBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.shuttle[NO_SHUTTLE_BADGE_KEY];

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/shuttle/noShuttle.png")}
      backgroundColor={background}
      iconColor={icon}
      label={showLabel ? "No Shuttle" : undefined}
    />
  );
}
