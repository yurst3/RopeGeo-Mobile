import { AvatarProfileBadge } from "@/components/badges/profile/AvatarProfileBadge";
import { ProfileBadge } from "@/components/badges/profile/ProfileBadge";
import { useColorTheme } from "@/context/theme/ColorThemeContext";

const TRIP_REPORT_ICON = require("@/assets/images/icons/buttons/tripReport.png");

type ReporterBadgeProps = {
  selected?: boolean;
  onPress?: () => void;
};

export function Reporter1({ selected, onPress }: ReporterBadgeProps) {
  const { badge } = useColorTheme();

  return (
    <ProfileBadge
      tier="bronze"
      icon={TRIP_REPORT_ICON}
      iconColor={badge.profileIcon.icon}
      iconBackgroundColor={badge.profileIcon.background}
      title="Reporter I"
      description="Submit 1 trip report"
      selected={selected}
      onPress={onPress}
    />
  );
}

export function AvatarReporter1({
  selected,
  onPress,
  plateRatio,
  iconScale,
  medalOnly,
}: ReporterBadgeProps & {
  plateRatio?: number;
  iconScale?: number;
  medalOnly?: boolean;
}) {
  const { badge } = useColorTheme();

  return (
    <AvatarProfileBadge
      tier="bronze"
      icon={TRIP_REPORT_ICON}
      iconColor={badge.profileIcon.icon}
      iconBackgroundColor={badge.profileIcon.background}
      title="Reporter I"
      description="Submit 1 trip report"
      selected={selected}
      onPress={onPress}
      plateRatio={plateRatio}
      iconScale={iconScale}
      medalOnly={medalOnly}
    />
  );
}
