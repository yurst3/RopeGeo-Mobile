import { AvatarProfileBadge } from "@/components/badges/profile/AvatarProfileBadge";
import { ProfileBadge } from "@/components/badges/profile/ProfileBadge";
import { useColorTheme } from "@/context/theme/ColorThemeContext";

const TRIP_REPORT_ICON = require("@/assets/images/icons/buttons/tripReport.png");

type ReporterBadgeProps = {
  selected?: boolean;
  onPress?: () => void;
};

export function Reporter2({ selected, onPress }: ReporterBadgeProps) {
  const { badge } = useColorTheme();

  return (
    <ProfileBadge
      tier="silver"
      icon={TRIP_REPORT_ICON}
      iconColor={badge.profileIcon.icon}
      iconBackgroundColor={badge.profileIcon.background}
      title="Reporter II"
      description="Submit 10 trip reports"
      selected={selected}
      onPress={onPress}
    />
  );
}

export function AvatarReporter2({
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
      tier="silver"
      icon={TRIP_REPORT_ICON}
      iconColor={badge.profileIcon.icon}
      iconBackgroundColor={badge.profileIcon.background}
      title="Reporter II"
      description="Submit 10 trip reports"
      selected={selected}
      onPress={onPress}
      plateRatio={plateRatio}
      iconScale={iconScale}
      medalOnly={medalOnly}
    />
  );
}
