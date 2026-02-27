import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function LongDayBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/difficulty/time/longDay.png")}
      backgroundColor={BadgeBackgroundColor.Orange}
      subIcon={require("@/assets/images/badgeIcons/difficulty/time/4.png")}
      label={showLabel ? "Long Day" : undefined}
    />
  );
}
