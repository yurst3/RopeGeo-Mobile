import {
  buildTextDefinition,
  type FontProfile,
  type FontProfileKey,
  type TextDefinition,
  type TextStyleProfile,
  type UiScaleProfile,
  type UiScaleProfileKey,
} from "@/constants/text";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type TextContextValue = TextDefinition;

const TextContext = createContext<TextContextValue | null>(null);

const DEFAULT_UI_SCALE_PROFILE: UiScaleProfileKey = "Auto";
const DEFAULT_FONT_PROFILE: FontProfileKey = "Auto";

export function TextProvider({ children }: { children: ReactNode }) {
  const [uiScaleProfileKey] = useState<UiScaleProfileKey>(
    DEFAULT_UI_SCALE_PROFILE,
  );
  const [fontProfileKey] = useState<FontProfileKey>(DEFAULT_FONT_PROFILE);

  const value = useMemo<TextContextValue>(
    () => buildTextDefinition(uiScaleProfileKey, fontProfileKey),
    [uiScaleProfileKey, fontProfileKey],
  );

  return (
    <TextContext.Provider value={value}>{children}</TextContext.Provider>
  );
}

export function useText(): TextDefinition {
  const ctx = useContext(TextContext);
  if (ctx == null) {
    throw new Error("useText must be used within TextProvider");
  }
  return ctx;
}

export function useUiScaleProfileKey(): UiScaleProfileKey {
  return useText().uiScaleProfileKey;
}

export function useUiScale(): UiScaleProfile {
  return useText().uiScale;
}

export function useFontProfileKey(): FontProfileKey {
  return useText().fontProfileKey;
}

export function useTextFont(): FontProfile {
  return useText().font;
}

export function useTextStyle(): TextStyleProfile {
  return useText().style;
}
