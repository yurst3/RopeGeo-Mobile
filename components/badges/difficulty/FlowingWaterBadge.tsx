import { AcaWaterSubRating, DifficultyRatingSystem } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/theme/ColorThemeContext";

export function FlowingWaterBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.difficultyRating[DifficultyRatingSystem.ACA][AcaWaterSubRating.C];

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/water/flowing.png")}
      backgroundColor={background}
      iconColor={icon}
      subIcon={require("@/assets/images/icons/badges/difficulty/water/c.png")}
      label={showLabel ? "Flowing Water" : undefined}
    />
  );
}
