import { AcaTimeSubRating, DifficultyRatingSystem } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/ColorThemeContext";

export function ShortBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.difficultyRating[DifficultyRatingSystem.ACA][AcaTimeSubRating.I];

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/time/short.png")}
      backgroundColor={background}
      iconColor={icon}
      subIcon={require("@/assets/images/icons/badges/difficulty/time/1.png")}
      label={showLabel ? "Short" : undefined}
    />
  );
}
