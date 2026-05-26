import { NotTechnicalBadge } from "@/components/badges/difficulty/NotTechnicalBadge";
import { ScramblingBadge } from "@/components/badges/difficulty/ScramblingBadge";
import { TechnicalBadge } from "@/components/badges/difficulty/TechnicalBadge";
import { VeryTechnicalBadge } from "@/components/badges/difficulty/VeryTechnicalBadge";
import { InfoScreenLayout } from "@/components/screens/info/InfoScreenLayout";
import { useInfoScreenStyles } from "@/components/screens/info/infoScreenTheme";
import { AcaTechnicalSubRating } from "ropegeo-common/models";
import React from "react";
import { Text, View } from "react-native";

const TECHNICAL_ORDER: AcaTechnicalSubRating[] = Object.values(AcaTechnicalSubRating);

const TECHNICAL_BADGES: Record<
  AcaTechnicalSubRating,
  React.ComponentType<{ showLabel?: boolean }>
> = {
  [AcaTechnicalSubRating.One]: NotTechnicalBadge,
  [AcaTechnicalSubRating.Two]: ScramblingBadge,
  [AcaTechnicalSubRating.Three]: TechnicalBadge,
  [AcaTechnicalSubRating.Four]: VeryTechnicalBadge,
};

/** Descriptions aligned with ACA technical class. See ropewiki.com/ACA_rating, canyoneeringusa.com, dankat.com. */
const TECHNICAL_DESCRIPTIONS: Record<AcaTechnicalSubRating, { body: string }> = {
  [AcaTechnicalSubRating.One]: {
    body:
      "Canyon hiking. Non-technical; no rope required. A hike through a canyon with no special physical obstacles, " +
      "though navigation may be difficult. May involve easy scrambling with occasional use of hands for balance.",
  },
  [AcaTechnicalSubRating.Two]: {
    body:
      "Basic canyoneering. Scrambling, easy climbing or downclimbing; a rope may be handy for handlines, belays, " +
      "lowering packs and emergency use. Exit or retreat possible upcanyon without fixed ropes. " +
      "Suitable for hikers with reasonable fitness.",
  },
  [AcaTechnicalSubRating.Three]: {
    body:
      "Intermediate canyoneering. Rappels or technical climbing and/or downclimbing. Rope required for belays and " +
      "single-pitch rappels. Retreat upcanyon would require ascending fixed ropes. " +
      "Basic pothole escape techniques may be required.",
  },
  [AcaTechnicalSubRating.Four]: {
    body:
      "Advanced canyoneering. May involve multi-pitch rappels, complex rope work (re-belays, tyrollean traverse, " +
      "guided rappels), difficult pothole escapes, serious squeezing, extensive high-risk downclimbing, or " +
      "difficult-to-establish natural anchors. Rappels longer than 200 feet often earn a Class 4 rating.",
  },
};

export type TechnicalInfoScreenProps = {
  highlightedTechnical?: AcaTechnicalSubRating | null;
};

export function TechnicalInfoScreen({
  highlightedTechnical,
}: TechnicalInfoScreenProps) {
  const styles = useInfoScreenStyles();

  return (
    <InfoScreenLayout title="Technical ratings">
      <Text style={styles.subtitle}>
        The first number in an ACA rating denotes the degree of technical skill
        (especially rope work) required to complete the canyon successfully.
      </Text>
      {TECHNICAL_ORDER.map((technical) => {
        const BadgeComponent = TECHNICAL_BADGES[technical];
        const { body } = TECHNICAL_DESCRIPTIONS[technical];
        const isHighlighted = highlightedTechnical === technical;

        return (
          <View
            key={technical}
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
