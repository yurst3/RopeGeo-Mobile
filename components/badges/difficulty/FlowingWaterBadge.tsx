import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function FlowingWaterBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/water/flowing.png")}
      backgroundColor={BadgeBackgroundColor.Red}
      subIcon={require("@/assets/images/icons/badges/difficulty/water/c.png")}
      label={showLabel ? "Flowing Water" : undefined}
    />
  );
}
