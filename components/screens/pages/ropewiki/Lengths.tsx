import { ScalingText } from "@/components/text/ScalingText";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useTextStyle } from "@/context/TextContext";
import { useUiScale } from "@/context/UIScaleContext";
import React from "react";
import { StyleSheet, View } from "react-native";
import type { RopewikiPageView } from "ropegeo-common/models";

export type LengthsProps = Pick<
  RopewikiPageView,
  "overallLength" | "approachLength" | "descentLength" | "exitLength"
>;

function roundToTenth(n: number): number {
  return Math.round(n * 10) / 10;
}

function formatMiles(value: number): string {
  return `${roundToTenth(value)}mi`;
}

function hasLength(value: number | null): boolean {
  return value != null && value > 0;
}

function shouldShowLengths(props: LengthsProps): boolean {
  const { overallLength, approachLength, descentLength, exitLength } = props;
  return (
    hasLength(overallLength) ||
    hasLength(approachLength) ||
    hasLength(descentLength) ||
    hasLength(exitLength)
  );
}

const LABELS: Record<keyof LengthsProps, string> = {
  overallLength: "Overall Dist.",
  approachLength: "Approach Dist.",
  descentLength: "Descent Dist.",
  exitLength: "Exit Dist.",
};

function StatColumn({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const { text } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();

  return (
    <>
      <ScalingText
        size={uiScale.pageScreen.text.stat}
        typography={textStyle.pageScreen.stat}
        numberOfLines={1}
        measure={{ type: "width" }}
        style={[styles.value, { color: text.primary }]}
      >
        {value}
      </ScalingText>
      <ScalingText
        size={uiScale.pageScreen.text.statLabel}
        typography={textStyle.pageScreen.statLabel}
        numberOfLines={2}
        avoidMidWordLineBreaks
        measure={{ type: "lineCount", maxLinesAtMaxSize: 2 }}
        style={[styles.label, { color: text.secondary }]}
      >
        {label}
      </ScalingText>
    </>
  );
}

export function Lengths({
  overallLength,
  approachLength,
  descentLength,
  exitLength,
}: LengthsProps) {
  const items: { value: string; label: string }[] = [];
  if (hasLength(overallLength))
    items.push({ value: formatMiles(overallLength!), label: LABELS.overallLength });
  if (hasLength(approachLength))
    items.push({ value: formatMiles(approachLength!), label: LABELS.approachLength });
  if (hasLength(descentLength))
    items.push({ value: formatMiles(descentLength!), label: LABELS.descentLength });
  if (hasLength(exitLength))
    items.push({ value: formatMiles(exitLength!), label: LABELS.exitLength });

  if (!shouldShowLengths({ overallLength, approachLength, descentLength, exitLength })) {
    return null;
  }

  const columnCount = items.length;
  const rowStyle = [
    styles.row,
    columnCount === 1 && styles.rowCentered,
  ];
  const columnStyle = [
    styles.column,
    columnCount === 1 ? undefined : styles.columnFlex,
  ];

  return (
    <View style={styles.container}>
      <View style={[rowStyle, styles.rowWrap]}>
        {items.map((item) => (
          <View key={item.label} style={columnStyle}>
            <StatColumn value={item.value} label={item.label} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  row: {
    flexDirection: "row",
  },
  rowWrap: {
    flexWrap: "wrap",
  },
  rowCentered: {
    justifyContent: "center",
  },
  column: {
    alignItems: "center",
    minWidth: 80,
  },
  columnFlex: {
    flex: 1,
  },
  value: {
    marginBottom: 2,
    textAlign: "center",
  },
  label: {
    textAlign: "center",
  },
});
