import { ScalingText } from "@/components/text/ScalingText";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useTextStyle } from "@/context/TextContext";
import { useUiScale } from "@/context/UIScaleContext";
import React from "react";
import { StyleSheet, View } from "react-native";

export type RappelCountValue = { min: number; max: number } | number | null;

export type RappelInfoRowProps = {
  /** Number of rappels (single number, min–max range, or null shown as 0) */
  rappelCount: RappelCountValue;
  /** Longest rappel (e.g. "65 ft"); omit column if null */
  longestRappel: string | number | null;
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
  const hasLongest = longestRappel != null && String(longestRappel).trim() !== "";
  const hasJumps = jumps != null && jumps > 0;
  return hasRappelsValue(rappelCount) || hasLongest || hasJumps;
}

function formatLongestRappel(value: string | number | null): string {
  if (value == null) return "";
  if (typeof value === "number") return `${Math.round(value)} ft`;
  return String(value).trim();
}

export function RappelInfoRow({
  rappelCount,
  longestRappel,
  jumps,
  technicalRating,
}: RappelInfoRowProps) {
  const { text } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();

  if (!shouldShowRow({ rappelCount, longestRappel, jumps, technicalRating })) {
    return null;
  }

  const showLongest = longestRappel != null && formatLongestRappel(longestRappel) !== "";
  const showJumps = jumps != null;
  const columnCount = 1 + (showLongest ? 1 : 0) + (showJumps ? 1 : 0);

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
      <View style={styles.separator} />
      <View style={rowStyle}>
        <View style={columnStyle}>
          <ScalingText
            size={uiScale.pageScreen.text.stat}
            typography={textStyle.pageScreen.stat}
            numberOfLines={1}
            measure={{ type: "width" }}
            style={[styles.value, { color: text.primary }]}
          >
            {formatRappelCount(rappelCount)}
          </ScalingText>
          <ScalingText
            size={uiScale.pageScreen.text.statLabel}
            typography={textStyle.pageScreen.statLabel}
            numberOfLines={2}
            avoidMidWordLineBreaks
            measure={{ type: "lineCount", maxLinesAtMaxSize: 2 }}
            style={[styles.label, { color: text.secondary }]}
          >
            Number of Rappels
          </ScalingText>
        </View>
        {showLongest && (
          <View style={columnStyle}>
            <ScalingText
              size={uiScale.pageScreen.text.stat}
              typography={textStyle.pageScreen.stat}
              numberOfLines={1}
              measure={{ type: "width" }}
              style={[styles.value, { color: text.primary }]}
            >
              {formatLongestRappel(longestRappel)}
            </ScalingText>
            <ScalingText
              size={uiScale.pageScreen.text.statLabel}
              typography={textStyle.pageScreen.statLabel}
              numberOfLines={2}
              avoidMidWordLineBreaks
              measure={{ type: "lineCount", maxLinesAtMaxSize: 2 }}
              style={[styles.label, { color: text.secondary }]}
            >
              Longest Rappel
            </ScalingText>
          </View>
        )}
        {showJumps && (
          <View style={columnStyle}>
            <ScalingText
              size={uiScale.pageScreen.text.stat}
              typography={textStyle.pageScreen.stat}
              numberOfLines={1}
              measure={{ type: "width" }}
              style={[styles.value, { color: text.primary }]}
            >
              {String(jumps)}
            </ScalingText>
            <ScalingText
              size={uiScale.pageScreen.text.statLabel}
              typography={textStyle.pageScreen.statLabel}
              numberOfLines={1}
              avoidMidWordLineBreaks
              measure={{ type: "width" }}
              style={[styles.label, { color: text.secondary }]}
            >
              Jumps
            </ScalingText>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  separator: {
    height: 1,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
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
