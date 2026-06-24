import { COLORS, type ThemePaletteKey } from "@/constants/colors";
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

/** Coarse light/dark bucket for system chrome when a named palette does not apply. */
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
  if (preference === "Dark" || preference === "Fabulous") return "dark";
  return resolveSystemColorTheme(systemScheme);
}

function resolveThemePaletteKey(
  preference: ThemePreference,
  systemScheme: ColorSchemeName | null,
): ThemePaletteKey {
  if (preference === "Light") return "Light";
  if (preference === "Dark") return "Dark";
  if (preference === "Fabulous") return "Fabulous";
  return systemScheme === "dark" ? "Dark" : "Light";
}

export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const systemScheme = useColorScheme();
  const themePreference = settings.theme;
  const colorTheme = resolveColorTheme(themePreference, systemScheme);
  const paletteKey = resolveThemePaletteKey(themePreference, systemScheme);

  const value = useMemo<ColorThemeContextValue>(
    () => ({
      colorTheme,
      themePreference,
      colors: COLORS[paletteKey],
    }),
    [colorTheme, paletteKey, themePreference],
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
