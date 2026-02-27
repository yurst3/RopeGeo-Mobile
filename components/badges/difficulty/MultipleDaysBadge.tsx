import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function MultipleDaysBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/difficulty/time/multipleDays.png")}
      backgroundColor={BadgeBackgroundColor.Red}
      subIcon={require("@/assets/images/badgeIcons/difficulty/time/6.png")}
      label={showLabel ? "Multiple Days" : undefined}
    />
  );
}
