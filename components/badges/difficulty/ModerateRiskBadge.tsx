import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function ModerateRiskBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/risk/moderateRisk.png")}
      backgroundColor={BadgeBackgroundColor.Orange}
      subIcon={require("@/assets/images/icons/badges/difficulty/risk/pg13.png")}
      iconScale={0.9}
      label={showLabel ? "Moderate Risk" : undefined}
    />
  );
}
