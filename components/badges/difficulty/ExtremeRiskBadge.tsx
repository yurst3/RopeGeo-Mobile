import { AcaRiskSubRating, DifficultyRatingSystem } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/theme/ColorThemeContext";

export function ExtremeRiskBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.difficultyRating[DifficultyRatingSystem.ACA][AcaRiskSubRating.XX];

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/risk/extremeRisk.png")}
      backgroundColor={background}
      subIcon={require("@/assets/images/icons/badges/difficulty/risk/xx.png")}
      iconColor={icon}
      label={showLabel ? "Extreme Risk" : undefined}
    />
  );
}
