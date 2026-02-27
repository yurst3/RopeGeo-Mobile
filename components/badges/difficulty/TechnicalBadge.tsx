import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function TechnicalBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/difficulty/technical/technical.png")}
      iconScale={1.2}
      backgroundColor={BadgeBackgroundColor.Orange}
      subIcon={require("@/assets/images/badgeIcons/difficulty/technical/3.png")}
      label={showLabel ? "Technical" : undefined}
    />
  );
}
