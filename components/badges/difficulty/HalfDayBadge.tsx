import { AcaTimeSubRating, DifficultyRatingSystem } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/ColorThemeContext";

export function HalfDayBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.difficultyRating[DifficultyRatingSystem.ACA][AcaTimeSubRating.II];

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/time/halfDay.png")}
      backgroundColor={background}
      iconColor={icon}
      subIcon={require("@/assets/images/icons/badges/difficulty/time/2.png")}
      label={showLabel ? "Half Day" : undefined}
    />
  );
}
