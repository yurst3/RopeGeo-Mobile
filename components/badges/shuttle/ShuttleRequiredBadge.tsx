import { Badge } from "@/components/badges/Badge";
import { SHUTTLE_REQUIRED_BADGE_KEY } from "@/constants/badges";
import { useColorTheme } from "@/context/theme/ColorThemeContext";

export function ShuttleRequiredBadge({
  showLabel,
}: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.shuttle[SHUTTLE_REQUIRED_BADGE_KEY];
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/shuttle/shuttle.png")}
      backgroundColor={background}
      iconColor={icon}
      label={showLabel ? "Shuttle Required" : undefined}
    />
  );
}
