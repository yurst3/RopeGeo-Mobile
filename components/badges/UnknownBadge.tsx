import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/ColorThemeContext";


export function UnknownBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.unknown;

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/unkown.png")}
      backgroundColor={background}
      iconColor={icon}
      label={showLabel ? "Unknown" : undefined}
    />
  );
}
