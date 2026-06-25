import { AcaTechnicalSubRating, DifficultyRatingSystem } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/theme/ColorThemeContext";

export function NotTechnicalBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.difficultyRating[DifficultyRatingSystem.ACA][AcaTechnicalSubRating.One];

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/technical/notTechnical.png")}
      backgroundColor={background}
      iconColor={icon}
      subIcon={require("@/assets/images/icons/badges/difficulty/technical/1.png")}
      label={showLabel ? "Not Technical" : undefined}
    />
  );
}
