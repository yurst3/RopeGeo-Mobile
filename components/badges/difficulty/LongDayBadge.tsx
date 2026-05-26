import { AcaTimeSubRating, DifficultyRatingSystem } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/ColorThemeContext";

export function LongDayBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.difficultyRating[DifficultyRatingSystem.ACA][AcaTimeSubRating.IV];

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/time/longDay.png")}
      backgroundColor={background}
      iconColor={icon}
      subIcon={require("@/assets/images/icons/badges/difficulty/time/4.png")}
      label={showLabel ? "Long Day" : undefined}
    />
  );
}
