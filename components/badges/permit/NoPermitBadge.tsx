import { PermitStatus } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/ColorThemeContext";


export function NoPermitBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.permit[PermitStatus.No];

  return (
    <Badge
      iconColor={icon}
      icon={require("@/assets/images/icons/badges/permit/noPermit.png")}
      backgroundColor={background}
      label={showLabel ? "No Permit" : undefined}
    />
  );
}
