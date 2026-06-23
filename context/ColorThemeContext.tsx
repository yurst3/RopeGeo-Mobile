import { COLORS } from "@/constants/colors";
import type { ThemeColors } from "@/constants/colors/types";
import type { ThemePreference } from "@/constants/settings/types";
import { useSettings } from "@/context/SettingsContext";
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useColorScheme, type ColorSchemeName } from "react-native";

export type ColorTheme = "light" | "dark";

type ColorThemeContextValue = {
  colorTheme: ColorTheme;
  themePreference: ThemePreference;
  colors: ThemeColors;
};

const ColorThemeContext = createContext<ColorThemeContextValue | null>(null);

function resolveSystemColorTheme(scheme: ColorSchemeName | null): ColorTheme {
  return scheme === "dark" ? "dark" : "light";
}

function resolveColorTheme(
  preference: ThemePreference,
  systemScheme: ColorSchemeName | null,
): ColorTheme {
  if (preference === "Light") return "light";
  if (preference === "Dark") return "dark";
  return resolveSystemColorTheme(systemScheme);
}

export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const systemScheme = useColorScheme();
  const themePreference = settings.theme;
  const colorTheme = resolveColorTheme(themePreference, systemScheme);

  const value = useMemo<ColorThemeContextValue>(
    () => ({
      colorTheme,
      themePreference,
      colors: COLORS[colorTheme === "dark" ? "Dark" : "Light"],
    }),
    [colorTheme, themePreference],
  );

  return (
    <ColorThemeContext.Provider value={value}>
      {children}
    </ColorThemeContext.Provider>
  );
}

function useColorThemeContext(): ColorThemeContextValue {
  const ctx = useContext(ColorThemeContext);
  if (ctx == null) {
    throw new Error("useColorTheme must be used within ColorThemeProvider");
  }
  return ctx;
}

export function useColorTheme(): ThemeColors {
  return useColorThemeContext().colors;
}

export function useColorThemePreference(): ColorTheme {
  return useColorThemeContext().colorTheme;
}

export function useThemePreference(): ThemePreference {
  return useColorThemeContext().themePreference;
}
