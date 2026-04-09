import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import Slider from "@react-native-community/slider";
import {
  SearchFilter,
  type SearchOrder,
  type SearchParamsPosition,
} from "ropegeo-common/models";
import { DataSourceFilterCheckboxes } from "./DataSourceFilterCheckboxes";
import { FILTER_SHEET_HORIZONTAL_INSET } from "./filterSheetInsets";

const SEARCH_ORDERS: SearchOrder[] = ["similarity", "quality", "distance"];

const ORDER_LABELS: Record<SearchOrder, string> = {
  similarity: "Similarity",
  quality: "Quality",
  distance: "Distance",
};

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

  /** Single full-bleed grey when region row is order-disabled and AKA row is off (no pages). */
  const mergedDisabledGreyBand =
    regionsDisabledByOrder && akaDisabled;

  const onSimilarityChange = (v: number) => {
    const rounded = Math.round(v * 10) / 10;
    patch((s) => s.setSimilarityThreshold(rounded));
  };

  return (
    <>
      <View>
        <Text style={[styles.sectionLabel, styles.sectionLabelFirst]}>
          Search Order
        </Text>
        <View style={styles.radioGroup}>
          {SEARCH_ORDERS.map((order) => {
            const selected = filter.order === order;
            const disabled = order === "distance" && !canDistance;
            return (
              <Pressable
                key={order}
                style={styles.radioOption}
                onPress={() => setOrder(order)}
                disabled={disabled}
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled }}
              >
                <View
                  style={[
                    styles.radioOuter,
                    disabled && styles.radioOuterDisabled,
                    selected && styles.radioOuterSelected,
                  ]}
                >
                  {selected ? <View style={styles.radioInner} /> : null}
                </View>
                <Text
                  style={[
                    styles.radioLabel,
                    disabled && styles.radioLabelDisabled,
                  ]}
                >
                  {ORDER_LABELS[order]}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {!canDistance ? (
          <Text style={styles.hint}>
            Enable location to use distance ranking.
          </Text>
        ) : null}
      </View>

      <View style={styles.groupSpacer} />

      <View>
        {includeResultsInvalid ? (
          <Text style={styles.includeGroupWarning}>
            Must include either page or region results
          </Text>
        ) : null}
        <View style={styles.includeSwitchGroup}>
          <View style={[styles.switchRow, styles.switchRowIncludePages]}>
            <Text style={styles.switchLabel}>Include Page Results</Text>
            <Switch
              value={filter.includePages}
              onValueChange={(v) => patch((s) => s.setIncludePages(v))}
            />
          </View>
          {mergedDisabledGreyBand ? (
            <View style={styles.switchBlockDisabled}>
              <View style={styles.switchBlockDisabledInner}>
                <View style={styles.switchRow}>
                  <Text
                    style={[
                      styles.switchLabel,
                      styles.switchLabelMuted,
                    ]}
                  >
                    Include Region Results
                  </Text>
                  <Switch
                    value={filter.includeRegions}
                    onValueChange={(v) => patch((s) => s.setIncludeRegions(v))}
                    disabled
                  />
                </View>
                <Text style={styles.switchDisabledReason}>
                  No region results when order is &quot;Distance&quot;
                </Text>
                <View
                  style={[styles.switchRow, styles.switchRowInMergedGreyBand]}
                >
                  <Text
                    style={[styles.switchLabel, styles.switchLabelMuted]}
                  >
                    Match Page Aka Names
                  </Text>
                  <Switch
                    value={filter.includeAka}
                    onValueChange={(v) => patch((s) => s.setIncludeAka(v))}
                    disabled
                  />
                </View>
                <Text style={styles.switchDisabledReason}>
                  {akaDisabledReason}
                </Text>
              </View>
            </View>
          ) : (
            <>
              {regionsDisabledByOrder ? (
                <View style={styles.switchBlockDisabled}>
                  <View style={styles.switchBlockDisabledInner}>
                    <View style={styles.switchRow}>
                      <Text
                        style={[
                          styles.switchLabel,
                          styles.switchLabelMuted,
                        ]}
                      >
                        Include Region Results
                      </Text>
                      <Switch
                        value={filter.includeRegions}
                        onValueChange={(v) =>
                          patch((s) => s.setIncludeRegions(v))
                        }
                        disabled
                      />
                    </View>
                    <Text style={styles.switchDisabledReason}>
                      No region results when order is &quot;Distance&quot;
                    </Text>
                  </View>
                </View>
              ) : (
                <View
                  style={[styles.switchRow, styles.includeSwitchSpacingBelow]}
                >
                  <Text style={styles.switchLabel}>Include Region Results</Text>
                  <Switch
                    value={filter.includeRegions}
                    onValueChange={(v) => patch((s) => s.setIncludeRegions(v))}
                  />
                </View>
              )}
              {akaDisabled ? (
                <View style={styles.switchBlockDisabled}>
                  <View style={styles.switchBlockDisabledInner}>
                    <View style={styles.switchRow}>
                      <Text
                        style={[
                          styles.switchLabel,
                          akaDisabled && styles.switchLabelMuted,
                        ]}
                      >
                        Match Page Aka Names
                      </Text>
                      <Switch
                        value={filter.includeAka}
                        onValueChange={(v) => patch((s) => s.setIncludeAka(v))}
                        disabled={akaDisabled}
                      />
                    </View>
                    <Text style={styles.switchDisabledReason}>
                      {akaDisabledReason}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Match Page Aka Names</Text>
                  <Switch
                    value={filter.includeAka}
                    onValueChange={(v) => patch((s) => s.setIncludeAka(v))}
                  />
                </View>
              )}
            </>
          )}
        </View>
      </View>

      <View style={styles.groupSpacer} />

      <View>
        <Text style={styles.sectionLabel}>Name Similarity</Text>
        <View style={styles.sliderBlock}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            step={0.1}
            value={filter.similarityThreshold}
            onValueChange={onSimilarityChange}
            minimumTrackTintColor="#3b82f6"
            maximumTrackTintColor="#e5e7eb"
            thumbTintColor="#2563eb"
          />
          <Text style={styles.sliderValue}>
            {filter.similarityThreshold.toFixed(1)}
          </Text>
        </View>
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
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginTop: 0,
    marginBottom: 8,
  },
  sectionLabelFirst: {
    marginTop: 12,
  },
  hint: { fontSize: 13, color: "#6b7280", marginBottom: 0, marginTop: 4 },
  includeGroupWarning: {
    fontSize: 12,
    lineHeight: 16,
    color: "#dc2626",
    fontWeight: "500",
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
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    justifyContent: "space-between",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 72,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#9ca3af",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    borderColor: "#3b82f6",
  },
  radioOuterDisabled: {
    opacity: 0.4,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3b82f6",
  },
  radioLabel: {
    fontSize: 15,
    color: "#111827",
    flexShrink: 1,
  },
  radioLabelDisabled: {
    color: "#9ca3af",
  },
  switchBlockDisabled: {
    backgroundColor: "#e5e7eb",
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
    fontSize: 11,
    lineHeight: 15,
    color: "#dc2626",
    marginTop: 10,
    textAlign: "right",
  },
  switchLabel: { fontSize: 15, color: "#111827", flex: 1, marginRight: 12 },
  switchLabelMuted: {
    color: "#6b7280",
  },
  sliderBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  slider: { flex: 1, height: 40 },
  sliderValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    minWidth: 36,
    textAlign: "right",
  },
});
