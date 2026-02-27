import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function SwimmingWaterBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/difficulty/water/swimming.png")}
      backgroundColor={BadgeBackgroundColor.Yellow}
      subIcon={require("@/assets/images/badgeIcons/difficulty/water/b.png")}
      label={showLabel ? "Swimming Water" : undefined}
    />
  );
}
