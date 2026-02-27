import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function HalfDayBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/difficulty/time/halfDay.png")}
      backgroundColor={BadgeBackgroundColor.Yellow}
      subIcon={require("@/assets/images/badgeIcons/difficulty/time/2.png")}
      label={showLabel ? "Half Day" : undefined}
    />
  );
}
