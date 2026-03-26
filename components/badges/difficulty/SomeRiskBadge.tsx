import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function SomeRiskBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/risk/someRisk.png")}
      backgroundColor={BadgeBackgroundColor.Yellow}
      subIcon={require("@/assets/images/icons/badges/difficulty/risk/pg.png")}
      label={showLabel ? "Some Risk" : undefined}
    />
  );
}
