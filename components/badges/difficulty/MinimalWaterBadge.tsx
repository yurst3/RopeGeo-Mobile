import { AcaWaterSubRating, DifficultyRatingSystem } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/ColorThemeContext";

export function MinimalWaterBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.difficultyRating[DifficultyRatingSystem.ACA][AcaWaterSubRating.A];

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/water/minimal.png")}
      backgroundColor={background}
      iconColor={icon}
      subIcon={require("@/assets/images/icons/badges/difficulty/water/a.png")}
      label={showLabel ? "Minimal Water" : undefined}
    />
  );
}
