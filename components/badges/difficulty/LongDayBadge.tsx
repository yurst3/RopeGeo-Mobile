import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function LongDayBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/time/longDay.png")}
      backgroundColor={BadgeBackgroundColor.Orange}
      subIcon={require("@/assets/images/icons/badges/difficulty/time/4.png")}
      label={showLabel ? "Long Day" : undefined}
    />
  );
}
