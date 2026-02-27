import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function MinimalWaterBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/difficulty/water/minimal.png")}
      backgroundColor={BadgeBackgroundColor.Green}
      subIcon={require("@/assets/images/badgeIcons/difficulty/water/a.png")}
      label={showLabel ? "Minimal Water" : undefined}
    />
  );
}
