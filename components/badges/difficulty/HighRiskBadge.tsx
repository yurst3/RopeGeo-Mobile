import { AcaRiskSubRating, DifficultyRatingSystem } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/ColorThemeContext";

export function HighRiskBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.difficultyRating[DifficultyRatingSystem.ACA][AcaRiskSubRating.R];

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/risk/veryHighRisk.png")}
      backgroundColor={background}
      iconColor={icon}
      subIcon={require("@/assets/images/icons/badges/difficulty/risk/r.png")}
      label={showLabel ? "High Risk" : undefined}
    />
  );
}
