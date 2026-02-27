import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function FullDayBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/difficulty/time/fullDay.png")}
      backgroundColor={BadgeBackgroundColor.Yellow}
      subIcon={require("@/assets/images/badgeIcons/difficulty/time/3.png")}
      label={showLabel ? "Full Day" : undefined}
    />
  );
}
