import { PermitStatus } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/theme/ColorThemeContext";


export function RestrictedBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.permit[PermitStatus.Restricted];

  return (
    <Badge
      iconColor={icon}
      icon={require("@/assets/images/icons/badges/permit/restricted.png")}
      backgroundColor={background}
      label={showLabel ? "Restricted" : undefined}
    />
  );
}
