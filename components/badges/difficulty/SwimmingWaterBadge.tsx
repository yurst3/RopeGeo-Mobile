import { AcaWaterSubRating, DifficultyRatingSystem } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/ColorThemeContext";

export function SwimmingWaterBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.difficultyRating[DifficultyRatingSystem.ACA][AcaWaterSubRating.B];

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/water/swimming.png")}
      backgroundColor={background}
      iconColor={icon}
      subIcon={require("@/assets/images/icons/badges/difficulty/water/b.png")}
      label={showLabel ? "Swimming Water" : undefined}
    />
  );
}
