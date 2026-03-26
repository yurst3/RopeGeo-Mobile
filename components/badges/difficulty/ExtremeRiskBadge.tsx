import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function ExtremeRiskBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/risk/extremeRisk.png")}
      backgroundColor={BadgeBackgroundColor.Black}
      subIcon={require("@/assets/images/icons/badges/difficulty/risk/xx.png")}
      iconColor="#ef4444"
      label={showLabel ? "Extreme Risk" : undefined}
    />
  );
}
