import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function VeryTechnicalBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/technical/veryTechnical.png")}
      backgroundColor={BadgeBackgroundColor.Red}
      subIcon={require("@/assets/images/icons/badges/difficulty/technical/4.png")}
      label={showLabel ? "Very Technical" : undefined}
    />
  );
}
