import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function SwimmingWaterBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/water/swimming.png")}
      backgroundColor={BadgeBackgroundColor.Yellow}
      subIcon={require("@/assets/images/icons/badges/difficulty/water/b.png")}
      label={showLabel ? "Swimming Water" : undefined}
    />
  );
}
