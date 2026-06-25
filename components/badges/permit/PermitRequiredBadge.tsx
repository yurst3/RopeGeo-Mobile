import { PermitStatus } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/theme/ColorThemeContext";


export function PermitRequiredBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.permit[PermitStatus.Yes];

  return (
    <Badge
      iconColor={icon}
      icon={require("@/assets/images/icons/badges/permit/permitRequired.png")}
      backgroundColor={background}
      label={showLabel ? "Permit Required" : undefined}
    />
  );
}
