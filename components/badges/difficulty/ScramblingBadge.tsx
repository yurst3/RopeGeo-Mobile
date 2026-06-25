import { AcaTechnicalSubRating, DifficultyRatingSystem } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/theme/ColorThemeContext";

export function ScramblingBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.difficultyRating[DifficultyRatingSystem.ACA][AcaTechnicalSubRating.Two];

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/technical/scrambling.png")}
      iconScale={0.9}
      backgroundColor={background}
      iconColor={icon}
      subIcon={require("@/assets/images/icons/badges/difficulty/technical/2.png")}
      label={showLabel ? "Scrambling" : undefined}
    />
  );
}
