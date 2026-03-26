import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function ClosedBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/permit/closed.png")}
      backgroundColor={BadgeBackgroundColor.Red}
      label={showLabel ? "Closed" : undefined}
    />
  );
}
