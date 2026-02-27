import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function VeryHighRiskBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/difficulty/risk/veryHighRisk.png")}
      backgroundColor={BadgeBackgroundColor.Black}
      iconColor="#ef4444"
      subIcon={require("@/assets/images/badgeIcons/difficulty/risk/x.png")}
      label={showLabel ? "Very High Risk" : undefined}
    />
  );
}
