import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function NotTechnicalBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/icons/badges/difficulty/technical/notTechnical.png")}
      backgroundColor={BadgeBackgroundColor.Green}
      subIcon={require("@/assets/images/icons/badges/difficulty/technical/1.png")}
      label={showLabel ? "Not Technical" : undefined}
    />
  );
}
