import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function ScramblingBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/technical/scrambling.png")}
      iconScale={0.9}
      backgroundColor={BadgeBackgroundColor.Yellow}
      subIcon={require("@/assets/images/icons/badges/difficulty/technical/2.png")}
      label={showLabel ? "Scrambling" : undefined}
    />
  );
}
