import { UI_SCALE_PROFILES } from "@/constants/uiScale";
import type {
  UiScaleGlobal,
  UiScaleProfile,
  UiScaleProfileKey,
} from "@/constants/uiScale/types";
import { useSettings } from "@/context/app/SettingsContext";
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

type UIScaleContextValue = {
  uiScaleProfileKey: UiScaleProfileKey;
  uiScale: UiScaleProfile;
  uiScaleGlobal: UiScaleGlobal;
};

const UIScaleContext = createContext<UIScaleContextValue | null>(null);

export function UIScaleProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const uiScaleProfileKey = settings.uiScale;

  const value = useMemo<UIScaleContextValue>(() => {
    const uiScale = UI_SCALE_PROFILES[uiScaleProfileKey];
    return {
      uiScaleProfileKey,
      uiScale,
      uiScaleGlobal: uiScale.global,
    };
  }, [uiScaleProfileKey]);

  return (
    <UIScaleContext.Provider value={value}>{children}</UIScaleContext.Provider>
  );
}

export function useUiScaleProfileKey(): UiScaleProfileKey {
  return useUIScaleContext().uiScaleProfileKey;
}

export function useUiScale(): UiScaleProfile {
  return useUIScaleContext().uiScale;
}

export function useUiScaleGlobal(): UiScaleGlobal {
  return useUIScaleContext().uiScaleGlobal;
}

function useUIScaleContext(): UIScaleContextValue {
  const ctx = useContext(UIScaleContext);
  if (ctx == null) {
    throw new Error("useUiScale must be used within UIScaleProvider");
  }
  return ctx;
}
