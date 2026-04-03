import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APP_TOAST_DEFAULT_DURATION_MS } from "./constants";
import { Toast } from "./Toast";

export type ShowAppToastOptions = {
  variant: "success" | "error";
  /** Primary line (e.g. “Error”, “Success”). */
  message: string;
  /** Optional detail (e.g. API error text). */
  subtitle?: string;
  durationMs?: number;
};

type ShowAppToast = (opts: ShowAppToastOptions) => void;

const AppToastContext = createContext<ShowAppToast | null>(null);

export function useAppToast(): ShowAppToast {
  const ctx = useContext(AppToastContext);
  if (ctx == null) {
    throw new Error("useAppToast must be used within AppToastProvider");
  }
  return ctx;
}

/**
 * Global pill toasts (errors on navigation, {@link RequestToastNotifier}, etc.).
 * Renders above the navigation tree; uses safe-area top inset + 8pt.
 */
export function AppToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [payload, setPayload] = useState<ShowAppToastOptions | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((opts: ShowAppToastOptions) => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPayload(opts);
    setVisible(true);
    const ms = opts.durationMs ?? APP_TOAST_DEFAULT_DURATION_MS;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setVisible(false);
    }, ms);
  }, []);

  const onHidden = useCallback(() => {
    setPayload(null);
  }, []);

  const top = insets.top + 8;

  return (
    <AppToastContext.Provider value={show}>
      {children}
      {payload != null ? (
        <View style={styles.host} pointerEvents="box-none">
          <Toast
            visible={visible}
            variant={payload.variant}
            message={payload.message}
            subtitle={payload.subtitle}
            top={top}
            zIndex={99999}
            onHidden={onHidden}
          />
        </View>
      ) : null}
    </AppToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
  },
});
