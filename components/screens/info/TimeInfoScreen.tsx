import { FullDayBadge } from "@/components/badges/difficulty/FullDayBadge";
import { HalfDayBadge } from "@/components/badges/difficulty/HalfDayBadge";
import { LongDayBadge } from "@/components/badges/difficulty/LongDayBadge";
import { MultipleDaysBadge } from "@/components/badges/difficulty/MultipleDaysBadge";
import { OvernightBadge } from "@/components/badges/difficulty/OvernightBadge";
import { ShortBadge } from "@/components/badges/difficulty/ShortBadge";
import { InfoScreenLayout } from "@/components/screens/info/InfoScreenLayout";
import { useInfoScreenStyles } from "@/components/screens/info/infoScreenTheme";
import { AcaTimeSubRating } from "ropegeo-common/models";
import React from "react";
import { Text, View } from "react-native";

const TIME_ORDER: AcaTimeSubRating[] = Object.values(AcaTimeSubRating);

const TIME_BADGES: Record<
  AcaTimeSubRating,
  React.ComponentType<{ showLabel?: boolean }>
> = {
  [AcaTimeSubRating.I]: ShortBadge,
  [AcaTimeSubRating.II]: HalfDayBadge,
  [AcaTimeSubRating.III]: FullDayBadge,
  [AcaTimeSubRating.IV]: LongDayBadge,
  [AcaTimeSubRating.V]: OvernightBadge,
  [AcaTimeSubRating.VI]: MultipleDaysBadge,
};

/** Descriptions aligned with ACA duration (time) rating. See ropewiki.com/ACA_rating, canyoneeringusa.com, dankat.com. */
const TIME_DESCRIPTIONS: Record<AcaTimeSubRating, { body: string }> = {
  [AcaTimeSubRating.I]: {
    body:
      "Short. A couple of hours (typically 1–3 hours). Estimates are for a small team of experienced, " +
      "fit adults at a good pace; allow more time if your group is less proficient.",
  },
  [AcaTimeSubRating.II]: {
    body:
      "Half day. Normally requires about half a day (typically 4–6 hours).",
  },
  [AcaTimeSubRating.III]: {
    body:
      "Full day. Normally requires most of a day (typically 7–12 hours).",
  },
  [AcaTimeSubRating.IV]: {
    body:
      "Long day. Expected to take 13–18 hours. Get an early start, bring a headlamp. " +
      "Possible unintended bivy.",
  },
  [AcaTimeSubRating.V]: {
    body:
      "Overnight. More than one day; normally done in two days (1–2 days).",
  },
  [AcaTimeSubRating.VI]: {
    body:
      "Multi-day. Two full days or more. Plan accordingly for a multi-day canyon trip.",
  },
};

export type TimeInfoScreenProps = {
  highlightedTime?: AcaTimeSubRating | null;
};

export function TimeInfoScreen({ highlightedTime }: TimeInfoScreenProps) {
  const styles = useInfoScreenStyles();

  return (
    <InfoScreenLayout title="Time ratings">
      <Text style={styles.subtitle}>
        The Roman numerals in an ACA rating indicate approximately how long the
        entire canyon trip generally takes a typical group. Actual time can vary
        substantially; this is a guideline for distinguishing long canyons from
        short ones. Times assume a small (4–6 person) team of experienced, fit
        adults.
      </Text>
      {TIME_ORDER.map((time) => {
        const BadgeComponent = TIME_BADGES[time];
        const { body } = TIME_DESCRIPTIONS[time];
        const isHighlighted = highlightedTime === time;

        return (
          <View
            key={time}
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
