import { AcaRiskSubRating, DifficultyRatingSystem } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/ColorThemeContext";

export function ModerateRiskBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.difficultyRating[DifficultyRatingSystem.ACA][AcaRiskSubRating.PG13];

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/risk/moderateRisk.png")}
      backgroundColor={background}
      iconColor={icon}
      subIcon={require("@/assets/images/icons/badges/difficulty/risk/pg13.png")}
      iconScale={0.9}
      label={showLabel ? "Moderate Risk" : undefined}
    />
  );
}
