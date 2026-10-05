import { AvatarProfileBadge } from "@/components/badges/profile/AvatarProfileBadge";
import { ProfileBadge } from "@/components/badges/profile/ProfileBadge";
import { useColorTheme } from "@/context/theme/ColorThemeContext";

const TRIP_REPORT_ICON = require("@/assets/images/icons/buttons/tripReport.png");

type ReporterBadgeProps = {
  selected?: boolean;
  onPress?: () => void;
  locked?: boolean;
};

export function Reporter3({ selected, onPress, locked }: ReporterBadgeProps) {
  const { badge } = useColorTheme();

  return (
    <ProfileBadge
      tier="gold"
      icon={TRIP_REPORT_ICON}
      iconColor={badge.profileIcon.icon}
      iconBackgroundColor={badge.profileIcon.background}
      title="Reporter III"
      description="Submit 50 trip reports"
      progressBar={{ current: 27, total: 50 }}
      selected={selected}
      onPress={onPress}
      locked={locked}
    />
  );
}

export function AvatarReporter3({ selected, onPress }: ReporterBadgeProps) {
  const { badge } = useColorTheme();

  return (
    <AvatarProfileBadge
      tier="gold"
      icon={TRIP_REPORT_ICON}
      iconColor={badge.profileIcon.icon}
      iconBackgroundColor={badge.profileIcon.background}
      title="Reporter III"
      description="Submit 50 trip reports"
      selected={selected}
      onPress={onPress}
    />
  );
}
