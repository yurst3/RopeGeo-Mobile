import { useSettings } from "@/context/app/SettingsContext";
import { StyleSheet, View } from "react-native";
import type { LengthMeasurement } from "ropegeo-common/models";
import { StatFlowSection, type StatItem } from "./StatFlow";

export type RappelCountValue = { min: number; max: number } | number | null;

export type RappelInfoRowProps = {
  /** Number of rappels (single number, min–max range, or null shown as 0) */
  rappelCount: RappelCountValue;
  /** Longest rappel measurement (rendered via its own `.toString()`); omit column if null */
  longestRappel: LengthMeasurement | null;
  /** Jumps count; omit column if null */
  jumps: number | null;
  /** Technical rating 1–4; used for visibility. Show row if 3 or 4, or if any value present when 1/2/null */
  technicalRating: number | null;
};

function hasRappelsValue(rappelCount: RappelCountValue): boolean {
  if (rappelCount == null) return false;
  if (typeof rappelCount === "number") return rappelCount > 0;
  return rappelCount.min > 0 || rappelCount.max > 0;
}

function formatRappelCount(rappelCount: RappelCountValue): string {
  if (rappelCount == null) return "0";
  if (typeof rappelCount === "number") return String(rappelCount);
  return `${rappelCount.min}-${rappelCount.max}`;
}

function shouldShowRow(props: RappelInfoRowProps): boolean {
  const { rappelCount, longestRappel, jumps, technicalRating } = props;
  const technical = technicalRating ?? 0;
  if (technical === 3 || technical === 4) return true;
  const hasLongest = longestRappel != null;
  const hasJumps = jumps != null && jumps > 0;
  return hasRappelsValue(rappelCount) || hasLongest || hasJumps;
}

export function RappelInfoRow({
  rappelCount,
  longestRappel,
  jumps,
  technicalRating,
}: RappelInfoRowProps) {
  const { settings } = useSettings();
  const lengthSystem = settings.lengthMeasurementSystem;

  if (!shouldShowRow({ rappelCount, longestRappel, jumps, technicalRating })) {
    return null;
  }

  const items: StatItem[] = [
    {
      key: "rappelCount",
      value: formatRappelCount(rappelCount),
      label: "Number of Rappels",
    },
  ];
  if (longestRappel != null)
    items.push({
      key: "longestRappel",
      value: longestRappel.toMeasurementSystem(lengthSystem).toString(),
      label: "Longest Rappel",
    });
  if (jumps != null)
    items.push({ key: "jumps", value: String(jumps), label: "Jumps" });

  return (
    <View style={styles.container}>
      <View style={styles.separator} />
      <StatFlowSection items={items} resetKey={lengthSystem} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
  },
  separator: {
    height: 1,
    marginBottom: 16,
  },
});
