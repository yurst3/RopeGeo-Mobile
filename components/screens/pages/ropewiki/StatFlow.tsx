import { ScalingText } from "@/components/text/ScalingText";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { measureUnconstrainedTextWidth } from "@/utils/layout/scalingText";
import {
  useResolvedScalingBounds,
  useResolvedTypography,
  useTextMeasureKey,
} from "@/utils/theme/resolvers";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextLayoutEventData,
  type ViewStyle,
} from "react-native";

export type StatItem = { key: string; value: string; label: string };

/** Horizontal gap between stat columns within a row. */
const STAT_COLUMN_GAP = 12;
/** Vertical gap between wrapped rows within a section. */
const STAT_ROW_GAP = 12;
/** Narrowest a stat column may be before it is treated as too cramped. */
const MIN_STAT_COLUMN_WIDTH = 64;
/** Breathing room added around each stat's measured content width. */
const STAT_COLUMN_WIDTH_PADDING = 8;
/** Wide sandbox so measurement text never wraps. */
const MEASURE_LAYER_WIDTH = 10000;

function StatColumn({ value, label }: { value: string; label: string }) {
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

/**
 * A row of page stats rendered as a width-aware flow: every stat's natural width is
 * measured at max font size, then stats are packed into rows (via flex wrapping keyed on
 * each measured width) so they overflow to a new row instead of clipping or overlapping.
 *
 * `resetKey` (typically the active measurement system) forces a fresh measurement pass
 * whenever it changes, so column widths track the newly rendered stat strings.
 */
export function StatFlowSection({
  items,
  resetKey,
  style,
}: {
  items: StatItem[];
  resetKey: string;
  style?: StyleProp<ViewStyle>;
}) {
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const measureKey = useTextMeasureKey();
  const valueTypography = useResolvedTypography(textStyle.pageScreen.stat);
  const labelTypography = useResolvedTypography(textStyle.pageScreen.statLabel);
  const { maxFontSize: valueMaxFont } = useResolvedScalingBounds(
    uiScale.pageScreen.text.stat,
  );
  const { maxFontSize: labelMaxFont } = useResolvedScalingBounds(
    uiScale.pageScreen.text.statLabel,
  );

  const [containerWidth, setContainerWidth] = useState(0);
  const [valueWidths, setValueWidths] = useState<Record<string, number>>({});
  const [labelWidths, setLabelWidths] = useState<Record<string, number>>({});

  // Re-measure whenever the reset key, content, or the font/scale profile changes.
  const signature = useMemo(
    () =>
      `${measureKey}#${resetKey}#${items
        .map((i) => `${i.key}|${i.value}|${i.label}`)
        .join("~")}`,
    [measureKey, resetKey, items],
  );

  useLayoutEffect(() => {
    setValueWidths({});
    setLabelWidths({});
  }, [signature]);

  const onRowLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  const reportWidth = useCallback(
    (
      setter: Dispatch<SetStateAction<Record<string, number>>>,
      key: string,
      event: NativeSyntheticEvent<TextLayoutEventData>,
    ) => {
      const width = Math.round(measureUnconstrainedTextWidth(event.nativeEvent.lines));
      if (width <= 0) return;
      setter((prev) => (prev[key] === width ? prev : { ...prev, [key]: width }));
    },
    [],
  );

  const measured =
    containerWidth > 0 &&
    items.every((i) => valueWidths[i.key] != null && labelWidths[i.key] != null);

  const columnWidthFor = useCallback(
    (item: StatItem): number => {
      const content =
        Math.max(valueWidths[item.key] ?? 0, labelWidths[item.key] ?? 0) +
        STAT_COLUMN_WIDTH_PADDING;
      return Math.min(containerWidth, Math.max(MIN_STAT_COLUMN_WIDTH, content));
    },
    [valueWidths, labelWidths, containerWidth],
  );

  const valueMeasureStyle = useMemo(
    () => [valueTypography, { fontSize: valueMaxFont }],
    [valueTypography, valueMaxFont],
  );
  const labelMeasureStyle = useMemo(
    () => [labelTypography, { fontSize: labelMaxFont }],
    [labelTypography, labelMaxFont],
  );

  return (
    <View style={style}>
      <View
        style={[styles.row, measured ? styles.rowWrap : null]}
        onLayout={onRowLayout}
      >
        {items.map((item) => (
          <View
            key={item.key}
            style={
              measured
                ? [styles.columnPacked, { width: columnWidthFor(item) }]
                : styles.columnFluid
            }
          >
            <StatColumn value={item.value} label={item.label} />
          </View>
        ))}
      </View>
      <View style={styles.measureLayer} pointerEvents="none">
        {items.map((item) => (
          <View key={item.key} style={styles.measureRow}>
            <Text
              key={`value-${item.key}-${resetKey}-${measureKey}`}
              allowFontScaling={false}
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              style={valueMeasureStyle}
              onTextLayout={(event) => reportWidth(setValueWidths, item.key, event)}
            >
              {item.value}
            </Text>
            <Text
              key={`label-${item.key}-${resetKey}-${measureKey}`}
              allowFontScaling={false}
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              style={labelMeasureStyle}
              onTextLayout={(event) => reportWidth(setLabelWidths, item.key, event)}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Pre-measurement fallback: distribute evenly on a single row (scales to fit). */
  row: {
    flexDirection: "row",
  },
  /** Width-aware flow once each stat has been measured. */
  rowWrap: {
    flexWrap: "wrap",
    columnGap: STAT_COLUMN_GAP,
    rowGap: STAT_ROW_GAP,
    justifyContent: "center",
  },
  columnFluid: {
    flex: 1,
    alignItems: "center",
    minWidth: MIN_STAT_COLUMN_WIDTH,
  },
  columnPacked: {
    alignItems: "center",
  },
  value: {
    marginBottom: 2,
    textAlign: "center",
  },
  label: {
    textAlign: "center",
  },
  measureLayer: {
    position: "absolute",
    opacity: 0,
    left: 0,
    top: 0,
    width: MEASURE_LAYER_WIDTH,
  },
  measureRow: {
    flexDirection: "row",
  },
});
