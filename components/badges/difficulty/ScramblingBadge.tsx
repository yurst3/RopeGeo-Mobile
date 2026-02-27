import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function ScramblingBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/difficulty/technical/scrambling.png")}
      backgroundColor={BadgeBackgroundColor.Yellow}
      subIcon={require("@/assets/images/badgeIcons/difficulty/technical/2.png")}
      label={showLabel ? "Scrambling" : undefined}
    />
  );
}
