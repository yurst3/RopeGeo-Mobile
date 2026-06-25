import { ExtremeRiskBadge } from "@/components/badges/difficulty/ExtremeRiskBadge";
import { HighRiskBadge } from "@/components/badges/difficulty/HighRiskBadge";
import { ModerateRiskBadge } from "@/components/badges/difficulty/ModerateRiskBadge";
import { MinimalRiskBadge } from "@/components/badges/difficulty/MinimalRiskBadge";
import { SomeRiskBadge } from "@/components/badges/difficulty/SomeRiskBadge";
import { VeryHighRiskBadge } from "@/components/badges/difficulty/VeryHighRiskBadge";
import { InfoScreenLayout } from "@/components/screens/info/InfoScreenLayout";
import { useInfoScreenStyles } from "@/utils/info/infoScreenTheme";
import { AcaRiskSubRating } from "ropegeo-common/models";
import React from "react";
import { Text, View } from "react-native";

const RISK_ORDER: AcaRiskSubRating[] = Object.values(AcaRiskSubRating);

const RISK_BADGES: Record<AcaRiskSubRating, React.ComponentType<{ showLabel?: boolean }>> = {
  [AcaRiskSubRating.G]: MinimalRiskBadge,
  [AcaRiskSubRating.PG]: SomeRiskBadge,
  [AcaRiskSubRating.PG13]: ModerateRiskBadge,
  [AcaRiskSubRating.R]: HighRiskBadge,
  [AcaRiskSubRating.X]: VeryHighRiskBadge,
  [AcaRiskSubRating.XX]: ExtremeRiskBadge,
};

/** Descriptions aligned with ACA canyon risk ratings. See canyoneeringusa.com, ropewiki.com/ACA_rating, dankat.com. */
const RISK_DESCRIPTIONS: Record<
  AcaRiskSubRating,
  { minimumFor?: string; body: string }
> = {
  [AcaRiskSubRating.G]: {
    minimumFor: "technical rating 1",
    body:
      "Minimal risk. Normal risk factors are present. Non-technical canyon hiking; no rope required. " +
      "May involve easy scrambling with occasional use of hands for balance. Appropriate for beginners.",
  },
  [AcaRiskSubRating.PG]: {
    minimumFor: "technical rating 2",
    body:
      "Some additional considerations. Scrambling, easy climbing or downclimbing; a rope may be handy for handlines, " +
      "belays, lowering packs and emergency use. Exit or retreat possible upcanyon without fixed ropes. " +
      "Suitable for hikers with reasonable fitness.",
  },
  [AcaRiskSubRating.PG13]: {
    minimumFor: "technical rating 3 and 4",
    body:
      "Every class 3 and class 4 canyon is at least PG13 because rappels and technical terrain introduce significant risk. " +
      "Rope required for belays and single-pitch rappels (Class 3) or complex rope work such as multi-pitch rappels, " +
      "re-belays, or guided rappels (Class 4). Not appropriate for beginners; solid technical skills and sound judgment required.",
  },
  [AcaRiskSubRating.R]: {
    body:
      "Risky. One or more extraordinary risk factors exist that complicate the descent. " +
      "Solid technical skills and sound judgment critical. Not appropriate for beginners, even with competent leadership. " +
      "May include difficult rappels, exposed climbing or traversing, difficult anchors, loose or dangerous rock, " +
      "committing route finding, or prolonged water immersion. See the route description for specific factors.",
  },
  [AcaRiskSubRating.X]: {
    body:
      "Very high. Multiple risk factors exist that will complicate the descent. " +
      "Errors in technique or judgment will likely result in serious injury or death. " +
      "Descent should be attempted by expert canyoneers only.",
  },
  [AcaRiskSubRating.XX]: {
    body:
      "Extreme. The most serious rating. Multiple severe risk factors; only for highly experienced canyoneers. " +
      "Consequences of error are severe. Use varies among beta providers; read the route description carefully.",
  },
};

export type RiskInfoScreenProps = {
  highlightedRisk?: AcaRiskSubRating | null;
};

export function RiskInfoScreen({ highlightedRisk }: RiskInfoScreenProps) {
  const styles = useInfoScreenStyles();

  return (
    <InfoScreenLayout title="Effective Risk">
      <Text style={styles.subtitle}>
        The ACA rating system uses &quot;additional risk&quot; to denote elevated risk factors above the norm.
        &quot;Effective risk&quot; takes into account the technical rating
        and additional risk rating to reflect the true expected risk of a route.
        Each technical rating has a minimum effective risk which the ACA additional risk rating can increase.
      </Text>
      {RISK_ORDER.map((risk) => {
        const BadgeComponent = RISK_BADGES[risk];
        const { minimumFor, body } = RISK_DESCRIPTIONS[risk];
        const isHighlighted = highlightedRisk === risk;

        return (
          <View
            key={risk}
            style={[styles.row, isHighlighted && styles.rowHighlighted]}
          >
            <View style={styles.badgeWrap}>
              <BadgeComponent showLabel />
            </View>
            <View style={styles.descriptionWrap}>
              {minimumFor != null && (
                <Text style={styles.minimumFor}>
                  Minimum for {minimumFor}.
                </Text>
              )}
              <Text style={styles.body}>{body}</Text>
            </View>
          </View>
        );
      })}
    </InfoScreenLayout>
  );
}
