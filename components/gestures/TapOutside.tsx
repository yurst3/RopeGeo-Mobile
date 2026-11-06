import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import {
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

/** A touch that moves farther than this is a drag or scroll, not a press. */
const TAP_SLOP = 10;

type TapOutsideContextValue = {
  subscribe: (listener: () => void) => () => void;
  markTouchInside: () => void;
};

const TapOutsideContext = createContext<TapOutsideContextValue | null>(null);

/**
 * Watches every touch inside it without taking part in the responder system, so scrolling and
 * presses keep working. Children use {@link useTapOutside} to hear about presses outside them.
 */
export function TapOutsideRoot({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const listenersRef = useRef(new Set<() => void>());
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchInsideRef = useRef(false);

  const value = useMemo<TapOutsideContextValue>(
    () => ({
      subscribe: (listener) => {
        listenersRef.current.add(listener);
        return () => {
          listenersRef.current.delete(listener);
        };
      },
      markTouchInside: () => {
        touchInsideRef.current = true;
      },
    }),
    [],
  );

  const onTouchStart = (event: GestureResponderEvent) => {
    const { pageX, pageY } = event.nativeEvent;
    touchStartRef.current = { x: pageX, y: pageY };
  };

  const onTouchEnd = (event: GestureResponderEvent) => {
    const start = touchStartRef.current;
    const inside = touchInsideRef.current;
    touchStartRef.current = null;
    touchInsideRef.current = false;
    if (start == null || inside) return;
    const { pageX, pageY } = event.nativeEvent;
    if (Math.hypot(pageX - start.x, pageY - start.y) > TAP_SLOP) return;
    for (const listener of [...listenersRef.current]) {
      listener();
    }
  };

  const onTouchCancel = () => {
    touchStartRef.current = null;
    touchInsideRef.current = false;
  };

  return (
    <TapOutsideContext.Provider value={value}>
      <View
        style={style}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
      >
        {children}
      </View>
    </TapOutsideContext.Provider>
  );
}

/**
 * While `active`, calls `onTapOutside` for presses inside the nearest {@link TapOutsideRoot}
 * that don't start on the view given the returned `insideProps`.
 */
export function useTapOutside(active: boolean, onTapOutside: () => void) {
  const context = useContext(TapOutsideContext);
  const onTapOutsideRef = useRef(onTapOutside);
  onTapOutsideRef.current = onTapOutside;

  useEffect(() => {
    if (!active || context == null) return;
    return context.subscribe(() => onTapOutsideRef.current());
  }, [active, context]);

  const markTouchInside = useCallback(() => {
    context?.markTouchInside();
  }, [context]);

  return { insideProps: { onTouchStart: markTouchInside } };
}
