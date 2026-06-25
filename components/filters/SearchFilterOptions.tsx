import { ConstantText } from "@/components/text/ConstantText";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import {
  useResolvedScalingBounds,
  useResolvedTypography,
  useTextMeasureKey,
} from "@/utils/theme/resolvers";
import {
  computeScalingTextFontSizeFromWidth,
  measureUnconstrainedTextWidth,
} from "@/utils/layout/scalingText";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Slider from "@react-native-community/slider";
import {
  SearchFilter,
  type SearchOrder,
  type SearchParamsPosition,
} from "ropegeo-common/models";
import { DataSourceFilterCheckboxes } from "./DataSourceFilterCheckboxes";
import { FILTER_SHEET_HORIZONTAL_INSET } from "@/utils/filters/filterSheetInsets";
import { ScaledFilterSwitch } from "./ScaledFilterSwitch";
import { useFilterRadioMetrics } from "@/utils/filters/useFilterRadioMetrics";
import { useFilterTheme } from "@/utils/filters/useFilterTheme";

const SEARCH_ORDERS: SearchOrder[] = ["similarity", "quality", "distance"];

const ORDER_LABELS: Record<SearchOrder, string> = {
  similarity: "Similarity",
  quality: "Quality",
  distance: "Distance",
};

/** Longest search-order label; used to size all three columns consistently. */
const SEARCH_ORDER_MEASURE_LABEL = ORDER_LABELS.similarity;

const UNCONSTRAINED_MEASURE_WIDTH = 10000;

type SearchOrderRadioGroupProps = {
  selectedOrder: SearchOrder;
  canDistance: boolean;
  onSelectOrder: (order: SearchOrder) => void;
  radioButton: {
    uncheckedOutline: string;
    checkedFill: string;
  };
  text: {
    primary: string;
    tertiary: string;
  };
};

function SearchOrderRadioGroup({
  selectedOrder,
  canDistance,
  onSelectOrder,
  radioButton,
  text,
}: SearchOrderRadioGroupProps) {
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const radioButtonSpec = uiScale.filter.buttons.radio;
  const typographyStyle = useResolvedTypography(textStyle.filter.optionLabel);
  const { maxFontSize, minFontSize } = useResolvedScalingBounds(
    radioButtonSpec.text!,
  );
  const measureKey = useTextMeasureKey();
  const radioMetrics = useFilterRadioMetrics();

  const [slotWidth, setSlotWidth] = useState(0);
  const [textWidthAtMax, setTextWidthAtMax] = useState(0);

  useLayoutEffect(() => {
    setTextWidthAtMax(0);
  }, [measureKey]);

  const fontSize = useMemo(
    () =>
      computeScalingTextFontSizeFromWidth(slotWidth, textWidthAtMax, {
        maxFontSize,
        minFontSize,
        widthSafetyMargin: 2,
      }),
    [slotWidth, textWidthAtMax, maxFontSize, minFontSize],
  );

  const onLabelSlotLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (width > 0) {
      setSlotWidth(width);
    }
  }, []);

  return (
    <View style={styles.radioGroup}>
      <View style={styles.searchOrderMeasureLayer} pointerEvents="none">
        <Text
          key={measureKey}
          allowFontScaling={false}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          style={[typographyStyle, { fontSize: maxFontSize }]}
          onTextLayout={(event) => {
            const width = measureUnconstrainedTextWidth(event.nativeEvent.lines);
            if (width > 0) {
              setTextWidthAtMax(width);
            }
          }}
        >
          {SEARCH_ORDER_MEASURE_LABEL}
        </Text>
      </View>
      {SEARCH_ORDERS.map((order) => {
        const selected = selectedOrder === order;
        const disabled = order === "distance" && !canDistance;
        return (
          <Pressable
            key={order}
            style={styles.radioOption}
            onPress={() => onSelectOrder(order)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
          >
            <View
              style={[
                styles.radioOuter,
                {
                  width: radioMetrics.outerSize,
                  height: radioMetrics.outerSize,
                  borderRadius: radioMetrics.outerRadius,
                  borderWidth: radioMetrics.borderWidth,
                  marginRight: radioMetrics.marginRight,
                  borderColor: radioButton.uncheckedOutline,
                },
                disabled && styles.radioOuterDisabled,
                selected && { borderColor: radioButton.checkedFill },
              ]}
            >
              {selected ? (
                <View
                  style={[
                    styles.radioInner,
                    {
                      width: radioMetrics.innerSize,
                      height: radioMetrics.innerSize,
                      borderRadius: radioMetrics.innerRadius,
                      backgroundColor: radioButton.checkedFill,
                    },
                  ]}
                />
              ) : null}
            </View>
            <View style={styles.radioLabelWrap} onLayout={onLabelSlotLayout}>
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  typographyStyle,
                  styles.radioLabelText,
                  { fontSize, color: disabled ? text.tertiary : text.primary },
                ]}
              >
                {ORDER_LABELS[order]}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export type SearchFilterOptionsProps = {
  filter: SearchFilter;
  onChange: (filter: SearchFilter) => void;
  /** Required to enable distance ranking; shows an alert if distance is chosen without a fix. */
  livePosition: SearchParamsPosition | null;
};

function cloneFilter(f: SearchFilter): SearchFilter {
  return SearchFilter.fromJsonString(f.toString());
}

export function SearchFilterOptions({
  filter,
  onChange,
  livePosition,
}: SearchFilterOptionsProps) {
  const {
    filter: filterColors,
    sectionLabel,
    hintText,
    switchLabel,
    switchLabelMuted,
    disableSection,
    switchProps,
    text,
  } = useFilterTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const { radioButton, slider, noteText } = filterColors;

  const patch = (fn: (s: SearchFilter) => void) => {
    const s = cloneFilter(filter);
    fn(s);
    onChange(s);
  };

  const setOrder = (o: SearchOrder) => {
    if (o === "distance" && livePosition == null) {
      Alert.alert(
        "Location required",
        "Distance order needs your current location.",
      );
      return;
    }
    patch((s) => {
      s.setOrder(o);
      if (o === "distance") {
        s.setIncludeRegions(false);
      }
    });
  };

  const canDistance = livePosition != null;
  const regionsDisabledByOrder = filter.order === "distance";
  const akaDisabled = !filter.includePages;
  const akaDisabledReason =
    "Must include page results to match by aka names";

  const includeResultsInvalid =
    !filter.includePages && !filter.includeRegions;

  const mergedDisabledGreyBand =
    regionsDisabledByOrder && akaDisabled;

  const onSimilarityChange = (v: number) => {
    const rounded = Math.round(v * 10) / 10;
    patch((s) => s.setSimilarityThreshold(rounded));
  };

  const disabledBandStyle = [
    styles.switchBlockDisabled,
    disableSection,
  ];

  return (
    <>
      <View>
        <ConstantText
          size={uiScale.filter.text.sectionTitle}
          typography={textStyle.filter.sectionTitle}
          style={[styles.sectionLabel, styles.sectionLabelFirst, sectionLabel]}
        >
          Search Order
        </ConstantText>
        <SearchOrderRadioGroup
          selectedOrder={filter.order}
          canDistance={canDistance}
          onSelectOrder={setOrder}
          radioButton={radioButton}
          text={text}
        />
        {!canDistance ? (
          <ConstantText
            size={uiScale.filter.buttons.radio.subtext!}
            typography={textStyle.filter.optionSublabel}
            style={hintText}
          >
            Enable location to use distance ranking.
          </ConstantText>
        ) : null}
      </View>

      <View style={styles.groupSpacer} />

      <View>
        {includeResultsInvalid ? (
          <ConstantText
            size={uiScale.filter.text.note}
            typography={textStyle.filter.note}
            style={[styles.includeGroupWarning, { color: noteText }]}
          >
            Must include either page or region results
          </ConstantText>
        ) : null}
        <View style={styles.includeSwitchGroup}>
          <View style={[styles.switchRow, styles.switchRowIncludePages]}>
            <ConstantText
              size={uiScale.filter.buttons.switch.text!}
              typography={textStyle.filter.optionLabel}
              style={switchLabel}
            >
              Include Page Results
            </ConstantText>
            <ScaledFilterSwitch
              value={filter.includePages}
              onValueChange={(v) => patch((s) => s.setIncludePages(v))}
              {...switchProps}
            />
          </View>
          {mergedDisabledGreyBand ? (
            <View style={disabledBandStyle}>
              <View style={styles.switchBlockDisabledInner}>
                <View style={styles.switchRow}>
                  <ConstantText
                    size={uiScale.filter.buttons.switch.text!}
                    typography={textStyle.filter.optionLabel}
                    style={switchLabelMuted}
                  >
                    Include Region Results
                  </ConstantText>
                  <ScaledFilterSwitch
                    value={filter.includeRegions}
                    onValueChange={(v) => patch((s) => s.setIncludeRegions(v))}
                    disabled
                    {...switchProps}
                  />
                </View>
                <ConstantText
                  size={uiScale.filter.text.note}
                  typography={textStyle.filter.note}
                  style={[styles.switchDisabledReason, { color: noteText }]}
                >
                  No region results when order is &quot;Distance&quot;
                </ConstantText>
                <View
                  style={[styles.switchRow, styles.switchRowInMergedGreyBand]}
                >
                  <ConstantText
                    size={uiScale.filter.buttons.switch.text!}
                    typography={textStyle.filter.optionLabel}
                    style={switchLabelMuted}
                  >
                    Match Page Aka Names
                  </ConstantText>
                  <ScaledFilterSwitch
                    value={filter.includeAka}
                    onValueChange={(v) => patch((s) => s.setIncludeAka(v))}
                    disabled
                    {...switchProps}
                  />
                </View>
                <ConstantText
                  size={uiScale.filter.text.note}
                  typography={textStyle.filter.note}
                  style={[styles.switchDisabledReason, { color: noteText }]}
                >
                  {akaDisabledReason}
                </ConstantText>
              </View>
            </View>
          ) : (
            <>
              {regionsDisabledByOrder ? (
                <View style={disabledBandStyle}>
                  <View style={styles.switchBlockDisabledInner}>
                    <View style={styles.switchRow}>
                      <ConstantText
                    size={uiScale.filter.buttons.switch.text!}
                    typography={textStyle.filter.optionLabel}
                    style={switchLabelMuted}
                  >
                    Include Region Results
                  </ConstantText>
                      <ScaledFilterSwitch
                        value={filter.includeRegions}
                        onValueChange={(v) =>
                          patch((s) => s.setIncludeRegions(v))
                        }
                        disabled
                        {...switchProps}
                      />
                    </View>
                    <ConstantText
                      size={uiScale.filter.text.note}
                      typography={textStyle.filter.note}
                      style={[styles.switchDisabledReason, { color: noteText }]}
                    >
                      No region results when order is &quot;Distance&quot;
                    </ConstantText>
                  </View>
                </View>
              ) : (
                <View
                  style={[styles.switchRow, styles.includeSwitchSpacingBelow]}
                >
                  <ConstantText
                    size={uiScale.filter.buttons.switch.text!}
                    typography={textStyle.filter.optionLabel}
                    style={switchLabel}
                  >
                    Include Region Results
                  </ConstantText>
                  <ScaledFilterSwitch
                    value={filter.includeRegions}
                    onValueChange={(v) => patch((s) => s.setIncludeRegions(v))}
                    {...switchProps}
                  />
                </View>
              )}
              {akaDisabled ? (
                <View style={disabledBandStyle}>
                  <View style={styles.switchBlockDisabledInner}>
                    <View style={styles.switchRow}>
                      <ConstantText
                    size={uiScale.filter.buttons.switch.text!}
                    typography={textStyle.filter.optionLabel}
                    style={switchLabelMuted}
                  >
                    Match Page Aka Names
                  </ConstantText>
                      <ScaledFilterSwitch
                        value={filter.includeAka}
                        onValueChange={(v) => patch((s) => s.setIncludeAka(v))}
                        disabled={akaDisabled}
                        {...switchProps}
                      />
                    </View>
                    <ConstantText
                      size={uiScale.filter.text.note}
                      typography={textStyle.filter.note}
                      style={[styles.switchDisabledReason, { color: noteText }]}
                    >
                      {akaDisabledReason}
                    </ConstantText>
                  </View>
                </View>
              ) : (
                <View style={styles.switchRow}>
                  <ConstantText
                    size={uiScale.filter.buttons.switch.text!}
                    typography={textStyle.filter.optionLabel}
                    style={switchLabel}
                  >
                    Match Page Aka Names
                  </ConstantText>
                  <ScaledFilterSwitch
                    value={filter.includeAka}
                    onValueChange={(v) => patch((s) => s.setIncludeAka(v))}
                    {...switchProps}
                  />
                </View>
              )}
            </>
          )}
        </View>
      </View>

      <View style={styles.groupSpacer} />

      <View>
        <ConstantText
          size={uiScale.filter.text.sectionTitle}
          typography={textStyle.filter.sectionTitle}
          style={[styles.sectionLabel, sectionLabel]}
        >
          Name Similarity
        </ConstantText>
        <View style={styles.sliderBlock}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            step={0.1}
            value={filter.similarityThreshold}
            onValueChange={onSimilarityChange}
            minimumTrackTintColor={slider.filledBar}
            maximumTrackTintColor={slider.unfilledBar}
            thumbTintColor={slider.thumb}
          />
          <ConstantText
            size={uiScale.filter.buttons.checkbox.text!}
            typography={textStyle.filter.revertButton}
            style={[styles.sliderValue, { color: text.secondary }]}
          >
            {filter.similarityThreshold.toFixed(1)}
          </ConstantText>
        </View>
        <ConstantText
          size={uiScale.filter.text.note}
          typography={textStyle.filter.note}
          style={[styles.similarityNote, { color: noteText }]}
        >
          Similarity is how closely the search results should match the search bar
          input. A higher value means a stricter match with less results and a
          lower value means a looser match with more results.
        </ConstantText>
      </View>

      <View style={styles.groupSpacer} />

      <DataSourceFilterCheckboxes
        title="Data Source"
        value={filter.source}
        onChange={(sources) => patch((s) => s.setSource(sources))}
      />
    </>
  );
}

const styles = StyleSheet.create({
  groupSpacer: {
    height: 32,
  },
  sectionLabel: {
    marginTop: 0,
    marginBottom: 8,
  },
  sectionLabelFirst: {
    marginTop: 12,
  },
  hint: { marginBottom: 0, marginTop: 4 },
  includeGroupWarning: {
    marginBottom: 10,
  },
  includeSwitchGroup: {},
  switchRowIncludePages: {
    marginBottom: 12,
  },
  includeSwitchSpacingBelow: {
    marginBottom: 12,
  },
  switchRowInMergedGreyBand: {
    marginTop: 8,
  },
  radioGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchOrderMeasureLayer: {
    position: "absolute",
    opacity: 0,
    left: 0,
    top: 0,
    width: UNCONSTRAINED_MEASURE_WIDTH,
    maxHeight: 1,
    overflow: "hidden",
  },
  radioOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    overflow: "hidden",
    paddingVertical: 6,
  },
  radioOuter: {
    flexShrink: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterDisabled: {
    opacity: 0.4,
  },
  radioInner: {},
  radioLabelWrap: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  radioLabelText: {
    width: "100%",
  },
  switchBlockDisabled: {
    marginHorizontal: -FILTER_SHEET_HORIZONTAL_INSET,
    paddingVertical: 12,
  },
  switchBlockDisabledInner: {
    paddingHorizontal: FILTER_SHEET_HORIZONTAL_INSET,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchDisabledReason: {
    marginTop: 10,
    textAlign: "right",
  },
  sliderBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  slider: { flex: 1, height: 40 },
  sliderValue: {
    minWidth: 36,
    textAlign: "right",
  },
  similarityNote: {
    marginTop: 8,
  },
});
