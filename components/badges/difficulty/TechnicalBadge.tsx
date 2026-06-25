import { AcaTechnicalSubRating, DifficultyRatingSystem } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/theme/ColorThemeContext";

export function TechnicalBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.difficultyRating[DifficultyRatingSystem.ACA][AcaTechnicalSubRating.Three];

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/technical/technical.png")}
      iconScale={1.2}
      backgroundColor={background}
      iconColor={icon}
      subIcon={require("@/assets/images/icons/badges/difficulty/technical/3.png")}
      label={showLabel ? "Technical" : undefined}
    />
  );
}
