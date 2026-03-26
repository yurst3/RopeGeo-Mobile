import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function PermitRequiredBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/permit/permitRequired.png")}
      backgroundColor={BadgeBackgroundColor.Red}
      label={showLabel ? "Permit Required" : undefined}
    />
  );
}
