import { ClosedBadge } from "@/components/badges/permit/ClosedBadge";
import { NoPermitBadge } from "@/components/badges/permit/NoPermitBadge";
import { PermitRequiredBadge } from "@/components/badges/permit/PermitRequiredBadge";
import { RestrictedBadge } from "@/components/badges/permit/RestrictedBadge";
import { InfoScreenLayout } from "@/components/screens/info/InfoScreenLayout";
import { useInfoScreenStyles } from "@/components/screens/info/infoScreenTheme";
import { PermitStatus } from "ropegeo-common/models";
import React from "react";
import { Text, View } from "react-native";

const PERMIT_ORDER: PermitStatus[] = [
  PermitStatus.No,
  PermitStatus.Yes,
  PermitStatus.Restricted,
  PermitStatus.Closed,
];

const PERMIT_BADGES: Record<
  PermitStatus,
  React.ComponentType<{ showLabel?: boolean }>
> = {
  [PermitStatus.No]: NoPermitBadge,
  [PermitStatus.Yes]: PermitRequiredBadge,
  [PermitStatus.Restricted]: RestrictedBadge,
  [PermitStatus.Closed]: ClosedBadge,
};

/** Descriptions from RopeWiki Property:Requires_permits (https://ropewiki.com/Property:Requires_permits). */
const PERMIT_DESCRIPTIONS: Record<PermitStatus, { body: string }> = {
  [PermitStatus.No]: {
    body:
      "No permit is required to access the canyon. Always verify current regulations with local land managers before your trip.",
  },
  [PermitStatus.Yes]: {
    body:
      "A permit is required to access the canyon. Obtain permits through the managing agency or designated permit system before your trip.",
  },
  [PermitStatus.Restricted]: {
    body:
      "Access restricted due to commercial, environmental or archaeological reasons. Permits may be available only for special projects. " +
      "The canyon may only be accessed with a guide or on a guided tour, or with a special key (such as a cave gate). " +
      "It might be closed in spring due to nesting or breeding. Check with land managers for current access and permit options.",
  },
  [PermitStatus.Closed]: {
    body:
      "The canyon is closed to access. Do not attempt to enter. Closures may be temporary (e.g. seasonal, fire) or permanent; check for updates.",
  },
};

export type PermitInfoScreenProps = {
  highlightedPermit?: PermitStatus | null;
};

export function PermitInfoScreen({
  highlightedPermit,
}: PermitInfoScreenProps) {
  const styles = useInfoScreenStyles();

  return (
    <InfoScreenLayout title="Permit status">
      <Text style={styles.subtitle}>
        Permit status indicates whether access to the canyon requires a permit or
        is restricted. Requirements can change; always confirm with the
        managing agency before your trip.
      </Text>
      {PERMIT_ORDER.map((permit) => {
        const BadgeComponent = PERMIT_BADGES[permit];
        const { body } = PERMIT_DESCRIPTIONS[permit];
        const isHighlighted = highlightedPermit === permit;

        return (
          <View
            key={permit}
            style={[styles.row, isHighlighted && styles.rowHighlighted]}
          >
            <View style={styles.badgeWrap}>
              <BadgeComponent showLabel />
            </View>
            <View style={styles.descriptionWrap}>
              <Text style={styles.body}>{body}</Text>
            </View>
          </View>
        );
      })}
    </InfoScreenLayout>
  );
}
