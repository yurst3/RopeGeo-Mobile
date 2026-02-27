import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function NoPermitBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/permit/noPermit.png")}
      backgroundColor={BadgeBackgroundColor.Green}
      label={showLabel ? "No Permit" : undefined}
    />
  );
}
