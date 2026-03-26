import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function FullDayBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/time/fullDay.png")}
      backgroundColor={BadgeBackgroundColor.Yellow}
      subIcon={require("@/assets/images/icons/badges/difficulty/time/3.png")}
      label={showLabel ? "Full Day" : undefined}
    />
  );
}
