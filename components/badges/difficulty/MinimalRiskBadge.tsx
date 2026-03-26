import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function MinimalRiskBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/risk/minimalRisk.png")}
      backgroundColor={BadgeBackgroundColor.Green}
      subIcon={require("@/assets/images/icons/badges/difficulty/risk/g.png")}
      label={showLabel ? "Minimal Risk" : undefined}
    />
  );
}
