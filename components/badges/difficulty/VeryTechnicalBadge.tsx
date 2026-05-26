import { AcaTechnicalSubRating, DifficultyRatingSystem } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/ColorThemeContext";

export function VeryTechnicalBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.difficultyRating[DifficultyRatingSystem.ACA][AcaTechnicalSubRating.Four];

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/technical/veryTechnical.png")}
      backgroundColor={background}
      iconColor={icon}
      subIcon={require("@/assets/images/icons/badges/difficulty/technical/4.png")}
      label={showLabel ? "Very Technical" : undefined}
    />
  );
}
