import { FlowingC1WaterBadge } from "@/components/badges/difficulty/FlowingC1WaterBadge";
import { FlowingC2WaterBadge } from "@/components/badges/difficulty/FlowingC2WaterBadge";
import { FlowingC3WaterBadge } from "@/components/badges/difficulty/FlowingC3WaterBadge";
import { FlowingC4WaterBadge } from "@/components/badges/difficulty/FlowingC4WaterBadge";
import { FlowingWaterBadge } from "@/components/badges/difficulty/FlowingWaterBadge";
import { MinimalWaterBadge } from "@/components/badges/difficulty/MinimalWaterBadge";
import { SwimmingWaterBadge } from "@/components/badges/difficulty/SwimmingWaterBadge";
import { InfoScreenLayout } from "@/components/screens/info/InfoScreenLayout";
import { useInfoScreenStyles } from "@/utils/info/infoScreenTheme";
import { AcaWaterSubRating } from "ropegeo-common/models";
import React from "react";
import { Text, View } from "react-native";

const WATER_ORDER: AcaWaterSubRating[] = Object.values(AcaWaterSubRating);

const WATER_BADGES: Record<
  AcaWaterSubRating,
  React.ComponentType<{ showLabel?: boolean }>
> = {
  [AcaWaterSubRating.A]: MinimalWaterBadge,
  [AcaWaterSubRating.B]: SwimmingWaterBadge,
  [AcaWaterSubRating.C]: FlowingWaterBadge,
  [AcaWaterSubRating.C1]: FlowingC1WaterBadge,
  [AcaWaterSubRating.C2]: FlowingC2WaterBadge,
  [AcaWaterSubRating.C3]: FlowingC3WaterBadge,
  [AcaWaterSubRating.C4]: FlowingC4WaterBadge,
};

/** Descriptions aligned with ACA water class. See ropewiki.com/ACA_rating, canyoneeringusa.com, dankat.com. */
const WATER_DESCRIPTIONS: Record<AcaWaterSubRating, { body: string }> = {
  [AcaWaterSubRating.A]: {
    body:
      "Normally dry or very little water. Wading to waist deep at most. No water of consequence; " +
      "water if present can be avoided or is very shallow. Shoes may get wet; no wetsuit required.",
  },
  [AcaWaterSubRating.B]: {
    body:
      "Water with no current or light current. Still pools. Falls normally dry or running at a trickle. " +
      "Expect deep wading and/or swimming. Wetsuit or drysuit may be required depending on water and air temperatures.",
  },
  [AcaWaterSubRating.C]: {
    body:
      "Water with strong current. Waterfalls. Expect deep wading and/or swimming in current. " +
      "Wet canyon rope techniques required. Wetsuit or drysuit may be required.",
  },
  [AcaWaterSubRating.C1]: {
    body:
      "Normally has water with light to moderate current. Easy water hazards. " +
      "Rating higher than C1 suggests at least some swiftwater skill or ability to recognize hydraulic hazards.",
  },
  [AcaWaterSubRating.C2]: {
    body:
      "Normally has water with strong current. Water hazards like hydraulics and siphons require " +
      "advanced skills and special care.",
  },
  [AcaWaterSubRating.C3]: {
    body:
      "Normally has water with very strong current. Dangerous water hazards. Experts only.",
  },
  [AcaWaterSubRating.C4]: {
    body:
      "Extreme problems and hazards will be difficult to overcome, even for experienced experts " +
      "with strong swimming skills.",
  },
};

export type WaterInfoScreenProps = {
  highlightedWater?: AcaWaterSubRating | null;
};

export function WaterInfoScreen({ highlightedWater }: WaterInfoScreenProps) {
  const styles = useInfoScreenStyles();

  return (
    <InfoScreenLayout title="Water ratings">
      <Text style={styles.subtitle}>
        The letter in an ACA rating denotes the type of challenge presented by
        water in the canyon. Water level can fluctuate greatly; if you find
        more water or current than indicated, reevaluate your decision to
        attempt the descent.
      </Text>
      {WATER_ORDER.map((water) => {
        const BadgeComponent = WATER_BADGES[water];
        const { body } = WATER_DESCRIPTIONS[water];
        const isHighlighted = highlightedWater === water;

        return (
          <React.Fragment key={water}>
            {water === AcaWaterSubRating.C1 && (
              <View style={styles.cClassNote}>
                <Text style={styles.cClassNoteText}>
                  Class C canyons can be described more precisely with the C1
                  through C4 ratings. Water flow rates change throughout the
                  year, and a canyon's actual flow may be higher or lower than
                  what's described by the rating.
                </Text>
              </View>
            )}
            <View
              style={[styles.row, isHighlighted && styles.rowHighlighted]}
            >
              <View style={styles.badgeWrap}>
                <BadgeComponent showLabel />
              </View>
              <View style={styles.descriptionWrap}>
                <Text style={styles.body}>{body}</Text>
              </View>
            </View>
          </React.Fragment>
        );
      })}
    </InfoScreenLayout>
  );
}
