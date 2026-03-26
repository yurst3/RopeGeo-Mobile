import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function CanyonBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/route/canyon.png")}
      backgroundColor={BadgeBackgroundColor.LightOrange}
      label={showLabel ? "Canyon" : undefined}
    />
  );
}
