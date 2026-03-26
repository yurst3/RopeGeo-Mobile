import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function HighRiskBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/risk/veryHighRisk.png")}
      backgroundColor={BadgeBackgroundColor.Red}
      subIcon={require("@/assets/images/icons/badges/difficulty/risk/r.png")}
      label={showLabel ? "High Risk" : undefined}
    />
  );
}
