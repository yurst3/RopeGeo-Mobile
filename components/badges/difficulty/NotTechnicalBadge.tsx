import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function NotTechnicalBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/difficulty/technical/notTechnical.png")}
      backgroundColor={BadgeBackgroundColor.Green}
      subIcon={require("@/assets/images/badgeIcons/difficulty/technical/1.png")}
      label={showLabel ? "Not Technical" : undefined}
    />
  );
}
