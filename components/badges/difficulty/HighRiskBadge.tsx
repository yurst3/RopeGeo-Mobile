import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function HighRiskBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/difficulty/risk/veryHighRisk.png")}
      backgroundColor={BadgeBackgroundColor.Red}
      subIcon={require("@/assets/images/badgeIcons/difficulty/risk/r.png")}
      label={showLabel ? "High Risk" : undefined}
    />
  );
}
