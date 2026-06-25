import { AcaTimeSubRating, DifficultyRatingSystem } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/theme/ColorThemeContext";

export function MultipleDaysBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.difficultyRating[DifficultyRatingSystem.ACA][AcaTimeSubRating.VI];

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/time/multipleDays.png")}
      backgroundColor={background}
      iconColor={icon}
      subIcon={require("@/assets/images/icons/badges/difficulty/time/6.png")}
      label={showLabel ? "Multiple Days" : undefined}
    />
  );
}
