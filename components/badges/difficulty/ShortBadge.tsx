import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function ShortBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/difficulty/time/short.png")}
      backgroundColor={BadgeBackgroundColor.Green}
      subIcon={require("@/assets/images/badgeIcons/difficulty/time/1.png")}
      label={showLabel ? "Short" : undefined}
    />
  );
}
