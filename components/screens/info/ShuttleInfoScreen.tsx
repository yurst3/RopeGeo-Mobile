import { NoShuttleBadge } from "@/components/badges/shuttle/NoShuttleBadge";
import { ShuttleRequiredBadge } from "@/components/badges/shuttle/ShuttleRequiredBadge";
import { InfoScreenLayout } from "@/components/screens/info/InfoScreenLayout";
import { useInfoScreenStyles } from "@/components/screens/info/infoScreenTheme";
import React from "react";
import { Text, View } from "react-native";

type ShuttleStatus = "0" | "1";

const SHUTTLE_ORDER: ShuttleStatus[] = ["0", "1"];

const SHUTTLE_BADGES: Record<
  ShuttleStatus,
  React.ComponentType<{ showLabel?: boolean }>
> = {
  "0": NoShuttleBadge,
  "1": ShuttleRequiredBadge,
};

const SHUTTLE_DESCRIPTIONS: Record<ShuttleStatus, { body: string }> = {
  "0": {
    body:
      "No shuttle is needed. The exit of the canyon puts you back where you started, so you can leave a single vehicle at the trailhead.",
  },
  "1": {
    body:
      "A shuttle is required. The exit does not put you back where you started, so you need to arrange a shuttle from the exit back to the start (e.g. a second vehicle, or a pick-up).",
  },
};

export type ShuttleInfoScreenProps = {
  /** "0" = No Shuttle, "1" (or any non-zero) = Shuttle Required */
  highlightedShuttle?: string | null;
};

export function ShuttleInfoScreen({
  highlightedShuttle,
}: ShuttleInfoScreenProps) {
  const styles = useInfoScreenStyles();

  return (
    <InfoScreenLayout title="Shuttle">
      <Text style={styles.subtitle}>
        Shuttle status indicates whether the canyon exit returns you to the
        start. Plan your vehicles or shuttle accordingly before your trip.
      </Text>
      {SHUTTLE_ORDER.map((status) => {
        const BadgeComponent = SHUTTLE_BADGES[status];
        const { body } = SHUTTLE_DESCRIPTIONS[status];
        const isHighlighted =
          status === "0"
            ? highlightedShuttle === "0"
            : highlightedShuttle != null && highlightedShuttle !== "0";

        return (
          <View
            key={status}
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
