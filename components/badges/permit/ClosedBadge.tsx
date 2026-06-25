import { PermitStatus } from "ropegeo-common/models";
import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/theme/ColorThemeContext";


export function ClosedBadge({ showLabel }: { showLabel?: boolean } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.permit[PermitStatus.Closed];

  return (
    <Badge
      iconColor={icon}
      icon={require("@/assets/images/icons/badges/permit/closed.png")}
      backgroundColor={background}
      label={showLabel ? "Closed" : undefined}
    />
  );
}
