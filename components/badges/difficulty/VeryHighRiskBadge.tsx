import { AcaRiskSubRating, DifficultyRatingSystem } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/theme/ColorThemeContext";

export function VeryHighRiskBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.difficultyRating[DifficultyRatingSystem.ACA][AcaRiskSubRating.X];

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/risk/veryHighRisk.png")}
      backgroundColor={background}
      iconColor={icon}
      subIcon={require("@/assets/images/icons/badges/difficulty/risk/x.png")}
      label={showLabel ? "Very High Risk" : undefined}
    />
  );
}
