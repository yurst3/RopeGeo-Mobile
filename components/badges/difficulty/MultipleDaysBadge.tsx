import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function MultipleDaysBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/time/multipleDays.png")}
      backgroundColor={BadgeBackgroundColor.Red}
      subIcon={require("@/assets/images/icons/badges/difficulty/time/6.png")}
      label={showLabel ? "Multiple Days" : undefined}
    />
  );
}
