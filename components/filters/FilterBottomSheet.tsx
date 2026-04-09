import { useCallback, useEffect, useMemo } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type WithSpringConfig,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  RouteFilter,
  SavedPagesFilter,
  SearchFilter,
  type SearchParamsPosition,
} from "ropegeo-common/models";
import { DifficultyFilterOptions } from "./DifficultyFilterOptions";
import { RoutesFilterOptions } from "./RoutesFilterOptions";
import {
  SavedPagesFilterOptions,
} from "./SavedPagesFilterOptions";
import { SearchFilterOptions } from "./SearchFilterOptions";
import { FILTER_SHEET_HORIZONTAL_INSET } from "./filterSheetInsets";

const SHEET_MAX_HEIGHT_RATIO = 0.88;
/** Grab pill + title; used so ScrollView gets a real height (flex:1 inside maxHeight-only parents collapses). */
const SHEET_TOP_RESERVE = 84;
/** Footer area when Revert/Reset row is shown (no Apply button). */
const SHEET_FOOTER_RESERVE_WITH_ACTIONS = 88;
/** Minimal reserve when the footer has no buttons. */
const SHEET_FOOTER_RESERVE_EMPTY = 28;

/** Spring for sheet translateY — no overshoot/bounce at the rest position. */
const SHEET_SPRING: WithSpringConfig = {
  damping: 32,
  stiffness: 320,
  overshootClamping: true,
};

export type FilterSheetMode =
  | {
      kind: "explore-route";
      draft: RouteFilter;
      onDraftChange: (f: RouteFilter) => void;
      persisted: boolean;
      onRevert: () => void;
    }
  | {
      kind: "search";
      draft: SearchFilter;
      onDraftChange: (f: SearchFilter) => void;
      persisted: boolean;
      /** Live GPS fix for distance order (not persisted on the filter). */
      livePosition: SearchParamsPosition | null;
      onRevert: () => void;
    }
  | {
      kind: "saved-pages";
      draft: SavedPagesFilter;
      onDraftChange: (f: SavedPagesFilter) => void;
      persisted: boolean;
      onRevert: () => void;
    }
  | {
      kind: "region-route";
      draft: RouteFilter;
      onDraftChange: (f: RouteFilter) => void;
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

export function FilterBottomSheet({
  visible,
  onClose,
  mode,
}: FilterBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(400);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, SHEET_SPRING);
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
        translateY.value = withSpring(400, SHEET_SPRING, () =>
          runOnJS(closeSheet)(),
        );
      } else {
        translateY.value = withSpring(0, SHEET_SPRING);
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

  const showFooter =
    mode.kind === "region-route" || showRevert;

  const scrollAreaMaxHeight = Math.max(
    220,
    maxH -
      SHEET_TOP_RESERVE -
      (showFooter ? SHEET_FOOTER_RESERVE_WITH_ACTIONS : SHEET_FOOTER_RESERVE_EMPTY),
  );

  const handleRevert = () => {
    if (mode.kind === "region-route") return;
    mode.onRevert();
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
              style={{ maxHeight: scrollAreaMaxHeight }}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollPad}
                style={{ maxHeight: scrollAreaMaxHeight }}
                showsVerticalScrollIndicator
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
            {showFooter ? (
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
              </View>
            ) : null}
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

  return (
    <>
      <RoutesFilterOptions filter={filter} onChange={onChange} />
      <DifficultyFilterOptions
        options={filter.difficultyOptions}
        onChange={(o) =>
          patch((r) => {
            r.difficultyOptions = o;
          })
        }
      />
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

  return (
    <>
      <SearchFilterOptions
        filter={filter}
        onChange={onChange}
        livePosition={livePosition}
      />
      <DifficultyFilterOptions
        options={filter.difficultyOptions}
        onChange={(o) => patch((s) => s.setDifficultyOptions(o))}
      />
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

  return (
    <>
      <SavedPagesFilterOptions filter={filter} onChange={onChange} />
      <DifficultyFilterOptions
        options={filter.difficultyOptions}
        onChange={(o) => patch((s) => s.setDifficultyOptions(o))}
      />
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
    paddingTop: 8,
  },
  grabArea: {
    alignItems: "center",
    paddingBottom: 8,
    paddingHorizontal: FILTER_SHEET_HORIZONTAL_INSET,
  },
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
  scrollPad: {
    paddingBottom: 16,
    paddingHorizontal: FILTER_SHEET_HORIZONTAL_INSET,
  },
  footer: {
    gap: 10,
    paddingTop: 8,
    paddingHorizontal: FILTER_SHEET_HORIZONTAL_INSET,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: { color: "#1d4ed8", fontSize: 15, fontWeight: "500" },
});
