import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function FlowingWaterBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/difficulty/water/flowing.png")}
      backgroundColor={BadgeBackgroundColor.Red}
      subIcon={require("@/assets/images/badgeIcons/difficulty/water/c.png")}
      label={showLabel ? "Flowing Water" : undefined}
    />
  );
}
