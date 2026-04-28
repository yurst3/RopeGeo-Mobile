import * as Network from "expo-network";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { NetworkState } from "expo-network";
import { AppState } from "react-native";

/**
 * Dev only: set to `true` to force `isOnline` to `false` so you can test offline UI and request
 * gating without disabling Wi‑Fi. Ignored when `__DEV__` is false.
 */
const DEV_FORCE_OFFLINE_NETWORK = false;

/**
 * Dev only: when `true`, mount `NetworkStateDebugToasts` (inside `ToastProvider`) to show two
 * persistent pills with raw `NetworkState` from expo-network. Ignored when `__DEV__` is false.
 */
export const SHOW_NETWORK_STATE = __DEV__ && false;

/** Dev-only poll so stale `expo-network` snapshots recover if events are missed (e.g. simulator). */
const DEV_NETWORK_STATE_POLL_MS = 5_000;

export function isOnlineFromNetworkState(state: NetworkState): boolean {
  if (!state.isConnected) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

type NetworkStatusContextValue = {
  isOnline: boolean;
  networkState: NetworkState | null;
};

const NetworkStatusContext = createContext<NetworkStatusContextValue | null>(null);

export function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const [networkState, setNetworkState] = useState<NetworkState | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refreshFromNative = async () => {
      try {
        const next = await Network.getNetworkStateAsync();
        if (!cancelled) setNetworkState(next);
      } catch {
        if (!cancelled) setNetworkState(null);
      }
    };

    void refreshFromNative();

    const sub = Network.addNetworkStateListener((event) => {
      setNetworkState(event);
    });

    const appSub = AppState.addEventListener("change", (next) => {
      if (next === "active") void refreshFromNative();
    });

    let poll: ReturnType<typeof setInterval> | undefined;
    if (__DEV__) {
      poll = setInterval(() => void refreshFromNative(), DEV_NETWORK_STATE_POLL_MS);
    }

    return () => {
      cancelled = true;
      sub.remove();
      appSub.remove();
      if (poll != null) clearInterval(poll);
    };
  }, []);

  const isOnline = useMemo(() => {
    if (__DEV__ && DEV_FORCE_OFFLINE_NETWORK) {
      return false;
    }
    return networkState == null ? true : isOnlineFromNetworkState(networkState);
  }, [networkState]);

  const value = useMemo<NetworkStatusContextValue>(
    () => ({ isOnline, networkState }),
    [isOnline, networkState],
  );

  return (
    <NetworkStatusContext.Provider value={value}>
      {children}
    </NetworkStatusContext.Provider>
  );
}

export function useNetworkStatus(): NetworkStatusContextValue {
  const ctx = useContext(NetworkStatusContext);
  if (ctx == null) {
    throw new Error("useNetworkStatus must be used within NetworkStatusProvider");
  }
  return ctx;
}

/** Optional consumer when the provider may be absent (e.g. tests). */
export function useOptionalNetworkStatus(): NetworkStatusContextValue | null {
  return useContext(NetworkStatusContext);
}
