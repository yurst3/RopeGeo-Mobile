import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function ShortBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/time/short.png")}
      backgroundColor={BadgeBackgroundColor.Green}
      subIcon={require("@/assets/images/icons/badges/difficulty/time/1.png")}
      label={showLabel ? "Short" : undefined}
    />
  );
}
