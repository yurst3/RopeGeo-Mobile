import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function HalfDayBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/time/halfDay.png")}
      backgroundColor={BadgeBackgroundColor.Yellow}
      subIcon={require("@/assets/images/icons/badges/difficulty/time/2.png")}
      label={showLabel ? "Half Day" : undefined}
    />
  );
}
