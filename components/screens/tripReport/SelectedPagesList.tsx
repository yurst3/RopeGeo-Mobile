import { SelectedPageCard } from "@/components/screens/tripReport/SelectedPageCard";
import type { SelectedPagePreview } from "@/utils/navigation/pageSelection";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

const ITEM_GAP = 8;
const SETTLE_SPRING = { damping: 24, stiffness: 260, overshootClamping: true };
/** Opacity of the cards that aren't being dragged while a drag is in progress. */
const INACTIVE_DRAG_OPACITY = 0.5;
const OPACITY_FADE_MS = 150;

type Positions = Record<string, number>;

function positionsFromPages(pages: SelectedPagePreview[]): Positions {
  const positions: Positions = {};
  pages.forEach((page, index) => {
    positions[page.id] = index;
  });
  return positions;
}

export type SelectedPagesListProps = {
  pages: SelectedPagePreview[];
  onReorder: (pages: SelectedPagePreview[]) => void;
  onRemove: (pageId: string) => void;
  /** True from touch-down on a reorder handle until the drag ends, e.g. to pause scrolling. */
  onDragActiveChange: (active: boolean) => void;
};

/**
 * Selected pages as {@link SelectedPageCard}s that can be dragged into a new order by the
 * left-edge handle. Cards are laid out absolutely in fixed slots so the dragged card can move
 * freely while the others spring into place.
 */
export function SelectedPagesList({
  pages,
  onReorder,
  onRemove,
  onDragActiveChange,
}: SelectedPagesListProps) {
  const [itemHeight, setItemHeight] = useState(0);
  const positions = useSharedValue<Positions>(positionsFromPages(pages));
  const activeId = useSharedValue<string | null>(null);
  const dragTop = useSharedValue(0);
  const slot = useSharedValue(0);
  const count = useSharedValue(pages.length);

  useEffect(() => {
    positions.value = positionsFromPages(pages);
    count.value = pages.length;
  }, [pages, positions, count]);

  useEffect(() => {
    slot.value = itemHeight + ITEM_GAP;
  }, [itemHeight, slot]);

  const onItemLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.ceil(event.nativeEvent.layout.height);
    setItemHeight((current) => (current === next ? current : next));
  }, []);

  const commitOrder = useCallback(
    (finalPositions: Positions) => {
      const reordered = [...pages].sort(
        (a, b) => (finalPositions[a.id] ?? 0) - (finalPositions[b.id] ?? 0),
      );
      if (reordered.some((page, index) => page.id !== pages[index]?.id)) {
        onReorder(reordered);
      }
    },
    [pages, onReorder],
  );

  if (pages.length === 0) {
    return null;
  }

  const containerHeight =
    itemHeight > 0 ? pages.length * (itemHeight + ITEM_GAP) - ITEM_GAP : undefined;

  return (
    <View
      style={[
        styles.container,
        { height: containerHeight, opacity: itemHeight > 0 ? 1 : 0 },
      ]}
    >
      {pages.map((page) => (
        <SortableSelectedPage
          key={page.id}
          page={page}
          positions={positions}
          activeId={activeId}
          dragTop={dragTop}
          slot={slot}
          count={count}
          onLayout={onItemLayout}
          onRemove={onRemove}
          onDragActiveChange={onDragActiveChange}
          onCommitOrder={commitOrder}
        />
      ))}
    </View>
  );
}

function SortableSelectedPage({
  page,
  positions,
  activeId,
  dragTop,
  slot,
  count,
  onLayout,
  onRemove,
  onDragActiveChange,
  onCommitOrder,
}: {
  page: SelectedPagePreview;
  positions: SharedValue<Positions>;
  activeId: SharedValue<string | null>;
  dragTop: SharedValue<number>;
  slot: SharedValue<number>;
  count: SharedValue<number>;
  onLayout: (event: LayoutChangeEvent) => void;
  onRemove: (pageId: string) => void;
  onDragActiveChange: (active: boolean) => void;
  onCommitOrder: (positions: Positions) => void;
}) {
  const id = page.id;
  const dragStartTop = useSharedValue(0);

  const reorderGesture = useMemo(
    () =>
      Gesture.Pan()
        .hitSlop(8)
        .onBegin(() => {
          runOnJS(onDragActiveChange)(true);
        })
        .onStart(() => {
          const startTop = (positions.value[id] ?? 0) * slot.value;
          dragStartTop.value = startTop;
          dragTop.value = startTop;
          activeId.value = id;
        })
        .onUpdate((event) => {
          const maxTop = Math.max(0, (count.value - 1) * slot.value);
          const top = Math.min(
            maxTop,
            Math.max(0, dragStartTop.value + event.translationY),
          );
          dragTop.value = top;
          if (slot.value <= 0) return;
          const nextIndex = Math.round(top / slot.value);
          const currentIndex = positions.value[id] ?? 0;
          if (nextIndex === currentIndex) return;
          const next: Positions = { ...positions.value };
          for (const key in next) {
            if (next[key] === nextIndex) {
              next[key] = currentIndex;
            }
          }
          next[id] = nextIndex;
          positions.value = next;
        })
        .onEnd(() => {
          runOnJS(onCommitOrder)(positions.value);
        })
        .onFinalize(() => {
          if (activeId.value === id) {
            activeId.value = null;
          }
          runOnJS(onDragActiveChange)(false);
        }),
    [id, positions, activeId, dragTop, dragStartTop, slot, count, onDragActiveChange, onCommitOrder],
  );

  const animatedStyle = useAnimatedStyle(() => {
    const isActive = activeId.value === id;
    const restingTop = (positions.value[id] ?? 0) * slot.value;
    return {
      top: isActive ? dragTop.value : withSpring(restingTop, SETTLE_SPRING),
      zIndex: isActive ? 2 : 1,
      opacity: withTiming(
        activeId.value != null && !isActive ? INACTIVE_DRAG_OPACITY : 1,
        { duration: OPACITY_FADE_MS },
      ),
    };
  });

  return (
    <Animated.View style={[styles.item, animatedStyle]} onLayout={onLayout}>
      <SelectedPageCard
        preview={page}
        onRemove={() => onRemove(id)}
        reorderGesture={reorderGesture}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
  },
  item: {
    position: "absolute",
    left: 0,
    right: 0,
  },
});
