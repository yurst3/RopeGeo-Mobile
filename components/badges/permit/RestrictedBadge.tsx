import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function RestrictedBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/permit/restricted.png")}
      backgroundColor={BadgeBackgroundColor.Red}
      label={showLabel ? "Restricted" : undefined}
    />
  );
}
