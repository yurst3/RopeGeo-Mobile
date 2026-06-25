import {
  buildFontDefinition,
  type FontProfile,
  type FontProfileKey,
  type TextDefinition,
  type TextStyleProfile,
} from "@/constants/text";
import { useSettings } from "@/context/app/SettingsContext";
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

type TextContextValue = TextDefinition;

const TextContext = createContext<TextContextValue | null>(null);

export function TextProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const fontProfileKey = settings.font;

  const value = useMemo<TextContextValue>(
    () => buildFontDefinition(fontProfileKey),
    [fontProfileKey],
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

export function useFontProfileKey(): FontProfileKey {
  return useText().fontProfileKey;
}

export function useTextFont(): FontProfile {
  return useText().font;
}

export function useTextStyle(): TextStyleProfile {
  return useText().style;
}
