import { ScalingText } from "@/components/text/ScalingText";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import React from "react";
import { StyleSheet, View } from "react-native";
import type { RopewikiPageView } from "ropegeo-common/models";

export type ElevationGainsProps = Pick<
  RopewikiPageView,
  "approachElevGain" | "descentElevGain" | "exitElevGain"
>;

function formatFeet(value: number): string {
  return `${Math.round(value)}ft`;
}

function hasGain(value: number | null): boolean {
  return value != null && value !== 0;
}

function shouldShowElevationGains(props: ElevationGainsProps): boolean {
  const { approachElevGain, descentElevGain, exitElevGain } = props;
  return (
    hasGain(approachElevGain) ||
    hasGain(descentElevGain) ||
    hasGain(exitElevGain)
  );
}

const LABELS: Record<keyof ElevationGainsProps, string> = {
  approachElevGain: "Approach Gain",
  descentElevGain: "Descent Gain",
  exitElevGain: "Exit Gain",
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

export function ElevationGains({
  approachElevGain,
  descentElevGain,
  exitElevGain,
}: ElevationGainsProps) {
  const items: { value: string; label: string }[] = [];
  if (hasGain(approachElevGain))
    items.push({ value: formatFeet(approachElevGain!), label: LABELS.approachElevGain });
  if (hasGain(descentElevGain))
    items.push({ value: formatFeet(descentElevGain!), label: LABELS.descentElevGain });
  if (hasGain(exitElevGain))
    items.push({ value: formatFeet(exitElevGain!), label: LABELS.exitElevGain });

  if (
    !shouldShowElevationGains({
      approachElevGain,
      descentElevGain,
      exitElevGain,
    })
  ) {
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
