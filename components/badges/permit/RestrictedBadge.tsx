import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function RestrictedBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/permit/restricted.png")}
      backgroundColor={BadgeBackgroundColor.Red}
      label={showLabel ? "Restricted" : undefined}
    />
  );
}
