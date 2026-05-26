import { AcaTimeSubRating, DifficultyRatingSystem } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/ColorThemeContext";

export function FullDayBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.difficultyRating[DifficultyRatingSystem.ACA][AcaTimeSubRating.III];

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/time/fullDay.png")}
      backgroundColor={background}
      iconColor={icon}
      subIcon={require("@/assets/images/icons/badges/difficulty/time/3.png")}
      label={showLabel ? "Full Day" : undefined}
    />
  );
}
