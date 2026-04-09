import { Image } from "expo-image";
import { useCallback, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ACA_RISK_ORDER,
  ACA_TECHNICAL_ORDER,
  ACA_TIME_ORDER,
  ACA_WATER_ORDER,
  AcaDifficultyFilterOptions,
  AcaRiskRating,
  AcaTechnicalRating,
  AcaTimeRating,
  AcaWaterRating,
  DifficultyType,
  RiskMinMax,
  TechnicalMinMax,
  TimeMinMax,
  WaterMinMax,
  type DifficultyFilterOptions as PersistedDifficultyOptions,
} from "ropegeo-common/models";
import { fullRangeAcaDifficultyFilterOptions } from "@/lib/defaultAcaDifficultyFilterOptions";
import { AcaDiscreteRangeSlider } from "./AcaDiscreteRangeSlider";
import {
  ACA_RISK_BADGES,
  ACA_RISK_THUMB_TITLES,
  ACA_TECHNICAL_BADGES,
  ACA_TECHNICAL_THUMB_TITLES,
  ACA_TIME_BADGES,
  ACA_TIME_THUMB_TITLES,
  ACA_WATER_BADGES,
  ACA_WATER_THUMB_TITLES,
} from "./acaDifficultyBadgeMaps";

function orderedEnum<T extends string>(
  values: readonly T[],
  order: Record<T, number>,
): T[] {
  return [...values].sort((a, b) => order[a] - order[b]);
}

const ORDERED_TECHNICAL = orderedEnum(
  Object.values(AcaTechnicalRating),
  ACA_TECHNICAL_ORDER,
);
const ORDERED_WATER = orderedEnum(
  Object.values(AcaWaterRating),
  ACA_WATER_ORDER,
);
const ORDERED_TIME = orderedEnum(
  Object.values(AcaTimeRating),
  ACA_TIME_ORDER,
);
const ORDERED_RISK = orderedEnum(
  Object.values(AcaRiskRating),
  ACA_RISK_ORDER,
);

const DIFFICULTY_TYPES = Object.values(DifficultyType) as DifficultyType[];

/** Same pixel size as {@link SearchFilterOptions} `sourceIcon` (Ropewiki). */
const DIFFICULTY_TYPE_ICON_SIZE = 48;

const ACA_ICON = require("@/assets/images/icons/ACA.png");

const DIFFICULTY_ACA_LABEL = "American Canyoneering Association";

function difficultyTypeLabel(t: DifficultyType): string {
  if (t === DifficultyType.ACA) {
    return DIFFICULTY_ACA_LABEL;
  }
  return t;
}

export type DifficultyFilterOptionsProps = {
  options: PersistedDifficultyOptions | null;
  onChange: (next: PersistedDifficultyOptions | null) => void;
};

export function DifficultyFilterOptions({
  options,
  onChange,
}: DifficultyFilterOptionsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const selectedType: DifficultyType | null = useMemo(() => {
    if (options == null) return null;
    return options.difficultyType;
  }, [options]);

  const acaOptions =
    options instanceof AcaDifficultyFilterOptions
      ? options
      : null;

  const dropdownSummary =
    selectedType == null ? "All" : difficultyTypeLabel(selectedType);

  const selectType = useCallback(
    (next: DifficultyType | null) => {
      setPickerOpen(false);
      if (next == null) {
        onChange(null);
        return;
      }
      if (next === DifficultyType.ACA) {
        if (acaOptions != null) {
          onChange(acaOptions);
        } else {
          onChange(fullRangeAcaDifficultyFilterOptions());
        }
      }
    },
    [onChange, acaOptions],
  );

  const patchAca = useCallback(
    (next: AcaDifficultyFilterOptions) => {
      onChange(next);
    },
    [onChange],
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Difficulty Rating System</Text>
      <Pressable
        style={styles.dropdownTrigger}
        onPress={() => setPickerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Difficulty rating system"
      >
        <View style={styles.dropdownTriggerMain}>
          <Text
            style={styles.dropdownTriggerText}
            numberOfLines={2}
          >
            {dropdownSummary}
          </Text>
          {selectedType === DifficultyType.ACA ? (
            <Image
              source={ACA_ICON}
              style={styles.difficultyTypeIcon}
              contentFit="contain"
            />
          ) : null}
        </View>
        <Text style={styles.dropdownChevron}>▼</Text>
      </Pressable>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPickerOpen(false)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Difficulty Rating System</Text>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              <Pressable
                style={styles.modalRow}
                onPress={() => selectType(null)}
              >
                <Text style={styles.modalRowText}>All</Text>
              </Pressable>
              {DIFFICULTY_TYPES.map((t) => (
                <Pressable
                  key={t}
                  style={styles.modalRow}
                  onPress={() => selectType(t)}
                >
                  <Text style={styles.modalRowText}>
                    {difficultyTypeLabel(t)}
                  </Text>
                  {t === DifficultyType.ACA ? (
                    <Image
                      source={ACA_ICON}
                      style={styles.difficultyTypeIcon}
                      contentFit="contain"
                    />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {selectedType === DifficultyType.ACA && acaOptions != null ? (
        <View style={styles.acaBlock}>
          <AcaDiscreteRangeSlider
            label="Technical Rating"
            orderedValues={ORDERED_TECHNICAL}
            min={acaOptions.technical.min}
            max={acaOptions.technical.max}
            badges={ACA_TECHNICAL_BADGES}
            thumbTitles={ACA_TECHNICAL_THUMB_TITLES}
            onChange={(min, max) =>
              patchAca(
                new AcaDifficultyFilterOptions(
                  new TechnicalMinMax(min, max),
                  acaOptions.water,
                  acaOptions.time,
                  acaOptions.effectiveRisk,
                ),
              )
            }
          />
          <AcaDiscreteRangeSlider
            label="Water Rating"
            orderedValues={ORDERED_WATER}
            min={acaOptions.water.min}
            max={acaOptions.water.max}
            badges={ACA_WATER_BADGES}
            thumbTitles={ACA_WATER_THUMB_TITLES}
            onChange={(min, max) =>
              patchAca(
                new AcaDifficultyFilterOptions(
                  acaOptions.technical,
                  new WaterMinMax(min, max),
                  acaOptions.time,
                  acaOptions.effectiveRisk,
                ),
              )
            }
          />
          <AcaDiscreteRangeSlider
            label="Time Rating"
            orderedValues={ORDERED_TIME}
            min={acaOptions.time.min}
            max={acaOptions.time.max}
            badges={ACA_TIME_BADGES}
            thumbTitles={ACA_TIME_THUMB_TITLES}
            onChange={(min, max) =>
              patchAca(
                new AcaDifficultyFilterOptions(
                  acaOptions.technical,
                  acaOptions.water,
                  new TimeMinMax(min, max),
                  acaOptions.effectiveRisk,
                ),
              )
            }
          />
          <View>
            <AcaDiscreteRangeSlider
              label="Effective Risk Rating"
              orderedValues={ORDERED_RISK}
              min={acaOptions.effectiveRisk.min}
              max={acaOptions.effectiveRisk.max}
              badges={ACA_RISK_BADGES}
              thumbTitles={ACA_RISK_THUMB_TITLES}
              onChange={(min, max) =>
                patchAca(
                  new AcaDifficultyFilterOptions(
                    acaOptions.technical,
                    acaOptions.water,
                    acaOptions.time,
                    new RiskMinMax(min, max),
                  ),
                )
              }
            />
            <Text style={styles.effectiveRiskNote}>
              The ACA rating system uses &quot;additional risk&quot; to denote elevated risk factors above the norm.
              &quot;Effective risk&quot; takes into account the technical rating
              and additional risk rating to reflect the true expected risk of a route.
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  dropdownTriggerMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  difficultyTypeIcon: {
    width: DIFFICULTY_TYPE_ICON_SIZE,
    height: DIFFICULTY_TYPE_ICON_SIZE,
  },
  dropdownTriggerText: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  dropdownChevron: {
    fontSize: 12,
    color: "#6b7280",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
    position: "relative",
  },
  modalCard: {
    zIndex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    maxHeight: "70%",
    paddingVertical: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  modalList: {
    maxHeight: 320,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  modalRowText: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  acaBlock: {
    marginTop: 20,
  },
  effectiveRiskNote: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    color: "#dc2626",
  },
});
