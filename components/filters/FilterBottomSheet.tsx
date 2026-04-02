import { useCallback, useEffect, useMemo } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  RouteType,
  RouteFilter,
  SavedPagesFilter,
  SearchFilter,
  type SearchOrder,
  type SearchParamsPosition,
} from "ropegeo-common/classes";
import { fullRangeAcaDifficultyFilterOptions } from "@/lib/defaultAcaDifficultyFilterOptions";

const SHEET_MAX_HEIGHT_RATIO = 0.88;

export type FilterSheetMode =
  | {
      kind: "explore-route";
      draft: RouteFilter;
      onDraftChange: (f: RouteFilter) => void;
      persisted: boolean;
      onApply: () => void;
      onRevert: () => void;
    }
  | {
      kind: "search";
      draft: SearchFilter;
      onDraftChange: (f: SearchFilter) => void;
      persisted: boolean;
      /** Live GPS fix for distance order (not persisted on the filter). */
      livePosition: SearchParamsPosition | null;
      onApply: () => void;
      onRevert: () => void;
    }
  | {
      kind: "saved-pages";
      draft: SavedPagesFilter;
      onDraftChange: (f: SavedPagesFilter) => void;
      persisted: boolean;
      onApply: () => void;
      onRevert: () => void;
    }
  | {
      kind: "region-route";
      draft: RouteFilter;
      onDraftChange: (f: RouteFilter) => void;
      onApply: () => void;
      onReset: () => void;
    };

type FilterBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  mode: FilterSheetMode | null;
};

function titleForMode(m: FilterSheetMode): string {
  switch (m.kind) {
    case "explore-route":
    case "region-route":
      return "Route Filter";
    case "search":
      return "Search Filter";
    case "saved-pages":
      return "Saved Pages Filter";
  }
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function FilterBottomSheet({
  visible,
  onClose,
  mode,
}: FilterBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(400);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 28, stiffness: 280 });
    } else {
      translateY.value = 400;
    }
  }, [visible, translateY]);

  const closeSheet = useCallback(() => {
    onClose();
  }, [onClose]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 80 || e.velocityY > 800) {
        translateY.value = withSpring(400, {}, () => runOnJS(closeSheet)());
      } else {
        translateY.value = withSpring(0, { damping: 28, stiffness: 280 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const maxH = useMemo(
    () =>
      Math.round(Dimensions.get("window").height * SHEET_MAX_HEIGHT_RATIO),
    [],
  );

  if (mode == null) return null;

  const showRevert =
    (mode.kind === "explore-route" ||
      mode.kind === "search" ||
      mode.kind === "saved-pages") &&
    mode.persisted;

  const handleApply = () => {
    if (mode.kind === "search") {
      const d = mode.draft;
      if (d.order === "distance" && mode.livePosition == null) {
        Alert.alert(
          "Location required",
          'Turn on location or choose an order other than "distance".',
        );
        return;
      }
    }
    mode.onApply();
    onClose();
  };

  const handleRevert = () => {
    if (mode.kind === "region-route") return;
    mode.onRevert();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              maxHeight: maxH,
            },
            sheetStyle,
          ]}
        >
          <GestureDetector gesture={pan}>
            <View style={styles.grabArea}>
              <View style={styles.grabPill} />
              <Text style={styles.sheetTitle}>{titleForMode(mode)}</Text>
            </View>
          </GestureDetector>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.flex}
            >
              <ScrollView
                style={styles.flex}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollPad}
              >
                {mode.kind === "explore-route" || mode.kind === "region-route" ? (
                  <RouteFilterForm
                    filter={mode.draft}
                    onChange={mode.onDraftChange}
                  />
                ) : null}
                {mode.kind === "search" ? (
                  <SearchFilterForm
                    filter={mode.draft}
                    livePosition={mode.livePosition}
                    onChange={mode.onDraftChange}
                  />
                ) : null}
                {mode.kind === "saved-pages" ? (
                  <SavedPagesFilterForm
                    filter={mode.draft}
                    onChange={mode.onDraftChange}
                  />
                ) : null}
              </ScrollView>
            </KeyboardAvoidingView>
            <View style={styles.footer}>
              {mode.kind === "region-route" ? (
                <Pressable style={styles.secondaryBtn} onPress={mode.onReset}>
                  <Text style={styles.secondaryBtnText}>Reset</Text>
                </Pressable>
              ) : null}
              {showRevert ? (
                <Pressable style={styles.secondaryBtn} onPress={handleRevert}>
                  <Text style={styles.secondaryBtnText}>Revert to defaults</Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.primaryBtn} onPress={handleApply}>
                <Text style={styles.primaryBtnText}>Apply</Text>
              </Pressable>
            </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function RouteFilterForm({
  filter,
  onChange,
}: {
  filter: RouteFilter;
  onChange: (f: RouteFilter) => void;
}) {
  const patch = (fn: (r: RouteFilter) => void) => {
    const r = RouteFilter.fromJsonString(filter.toString());
    fn(r);
    onChange(r);
  };

  const toggleDifficulty = (on: boolean) => {
    patch((r) => {
      r.difficultyOptions = on ? fullRangeAcaDifficultyFilterOptions() : null;
    });
  };

  return (
    <>
      <Text style={styles.section}>Route type</Text>
      <View style={styles.rowWrap}>
        <Chip
          label="Any"
          selected={filter.routeType == null}
          onPress={() => patch((r) => { r.routeType = null; })}
        />
        {(Object.values(RouteType) as RouteType[]).map((t) => (
          <Chip
            key={t}
            label={t}
            selected={filter.routeType === t}
            onPress={() => patch((r) => { r.routeType = t; })}
          />
        ))}
      </View>
      {filter.regionId != null ? (
        <Text style={styles.hint}>
          Source scope for this region follows the page you opened (Ropewiki).
        </Text>
      ) : (
        <Text style={styles.hint}>
          Showing routes from all sources. Per-source filters apply on region
          maps.
        </Text>
      )}
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Filter by ACA difficulty</Text>
        <Switch
          value={filter.difficultyOptions != null}
          onValueChange={toggleDifficulty}
        />
      </View>
    </>
  );
}

function SearchFilterForm({
  filter,
  livePosition,
  onChange,
}: {
  filter: SearchFilter;
  livePosition: SearchParamsPosition | null;
  onChange: (f: SearchFilter) => void;
}) {
  const patch = (fn: (s: SearchFilter) => void) => {
    const s = SearchFilter.fromJsonString(filter.toString());
    fn(s);
    onChange(s);
  };

  const setOrder = (o: SearchOrder) => {
    patch((s) => {
      s.setOrder(o);
      if (o === "distance") {
        s.setIncludeRegions(false);
        s.setIncludeAka(false);
      }
    });
  };

  const toggleDifficulty = (on: boolean) => {
    patch((s) => {
      s.setDifficultyOptions(on ? fullRangeAcaDifficultyFilterOptions() : null);
    });
  };

  const canDistance = livePosition != null;

  return (
    <>
      <Text style={styles.section}>Order</Text>
      <View style={styles.rowWrap}>
        <Chip
          label="Similarity"
          selected={filter.order === "similarity"}
          onPress={() => setOrder("similarity")}
        />
        <Chip
          label="Quality"
          selected={filter.order === "quality"}
          onPress={() => setOrder("quality")}
        />
        <Chip
          label="Distance"
          selected={filter.order === "distance"}
          onPress={() => {
            if (!canDistance) {
              Alert.alert(
                "Location required",
                "Distance order needs your current location.",
              );
              return;
            }
            setOrder("distance");
          }}
        />
      </View>
      {!canDistance ? (
        <Text style={styles.hint}>
          Enable location to use distance ranking.
        </Text>
      ) : null}
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Include pages</Text>
        <Switch
          value={filter.includePages}
          onValueChange={(v) => patch((s) => s.setIncludePages(v))}
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Include regions</Text>
        <Switch
          value={filter.includeRegions}
          onValueChange={(v) => patch((s) => s.setIncludeRegions(v))}
          disabled={filter.order === "distance"}
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Include AKA names</Text>
        <Switch
          value={filter.includeAka}
          onValueChange={(v) => patch((s) => s.setIncludeAka(v))}
          disabled={!filter.includePages || filter.order === "distance"}
        />
      </View>
      <Text style={styles.hint}>
        Search uses all page sources until additional sources are added to the
        app.
      </Text>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Filter by ACA difficulty</Text>
        <Switch
          value={filter.difficultyOptions != null}
          onValueChange={toggleDifficulty}
        />
      </View>
    </>
  );
}

function SavedPagesFilterForm({
  filter,
  onChange,
}: {
  filter: SavedPagesFilter;
  onChange: (f: SavedPagesFilter) => void;
}) {
  const patch = (fn: (s: SavedPagesFilter) => void) => {
    const s = SavedPagesFilter.fromJsonString(filter.toString());
    fn(s);
    onChange(s);
  };

  const toggleDifficulty = (on: boolean) => {
    patch((s) => {
      s.setDifficultyOptions(on ? fullRangeAcaDifficultyFilterOptions() : null);
    });
  };

  return (
    <>
      <Text style={styles.section}>Sort by saved date</Text>
      <View style={styles.rowWrap}>
        <Chip
          label="Newest"
          selected={filter.order === "newest"}
          onPress={() => patch((s) => s.setOrder("newest"))}
        />
        <Chip
          label="Oldest"
          selected={filter.order === "oldest"}
          onPress={() => patch((s) => s.setOrder("oldest"))}
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Match AKA names</Text>
        <Switch
          value={filter.includeAka}
          onValueChange={(v) => patch((s) => s.setIncludeAka(v))}
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Filter by ACA difficulty</Text>
        <Switch
          value={filter.difficultyOptions != null}
          onValueChange={toggleDifficulty}
        />
      </View>
      <Text style={styles.hint}>
        Use the search field on the Saved tab to filter by title; open this
        panel for sort and difficulty.
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  flex: { flex: 1 },
  grabArea: { alignItems: "center", paddingBottom: 8 },
  grabPill: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#d1d5db",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    alignSelf: "flex-start",
  },
  scrollPad: { paddingBottom: 16 },
  section: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
    marginBottom: 8,
  },
  hint: { fontSize: 13, color: "#6b7280", marginBottom: 8 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  chipSelected: {
    backgroundColor: "#dbeafe",
    borderColor: "#3b82f6",
  },
  chipText: { fontSize: 14, color: "#374151" },
  chipTextSelected: { color: "#1d4ed8", fontWeight: "600" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  switchLabel: { fontSize: 15, color: "#111827", flex: 1, marginRight: 12 },
  footer: { gap: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  primaryBtn: {
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: { color: "#1d4ed8", fontSize: 15, fontWeight: "500" },
});
