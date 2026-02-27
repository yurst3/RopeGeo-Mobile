import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function OvernightBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/difficulty/time/overnight.png")}
      backgroundColor={BadgeBackgroundColor.Red}
      subIcon={require("@/assets/images/badgeIcons/difficulty/time/5.png")}
      label={showLabel ? "Overnight" : undefined}
    />
  );
}
