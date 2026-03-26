import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function FlowingC4WaterBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/water/flowing.png")}
      subIcon={require("@/assets/images/icons/badges/difficulty/water/c4.png")}
      subIconScale={1.2}
      backgroundColor={BadgeBackgroundColor.Black}
      iconColor="#ef4444"
      label={showLabel ? "Extreme Current" : undefined}
    />
  );
}
