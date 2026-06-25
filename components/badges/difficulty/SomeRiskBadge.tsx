import { AcaRiskSubRating, DifficultyRatingSystem } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/theme/ColorThemeContext";

export function SomeRiskBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.difficultyRating[DifficultyRatingSystem.ACA][AcaRiskSubRating.PG];

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/risk/someRisk.png")}
      backgroundColor={background}
      iconColor={icon}
      subIcon={require("@/assets/images/icons/badges/difficulty/risk/pg.png")}
      label={showLabel ? "Some Risk" : undefined}
    />
  );
}
