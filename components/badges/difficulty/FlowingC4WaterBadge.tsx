import { AcaWaterSubRating, DifficultyRatingSystem } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/theme/ColorThemeContext";

export function FlowingC4WaterBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.difficultyRating[DifficultyRatingSystem.ACA][AcaWaterSubRating.C4];

  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/water/flowing.png")}
      subIcon={require("@/assets/images/icons/badges/difficulty/water/c4.png")}
      subIconScale={1.2}
      backgroundColor={background}
      iconColor={icon}
      label={showLabel ? "Extreme Current" : undefined}
    />
  );
}
