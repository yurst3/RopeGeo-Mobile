import { COLORS } from "@/constants/colors";
import type { ThemeColors } from "@/constants/colors/types";
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
  colors: ThemeColors;
};

const ColorThemeContext = createContext<ColorThemeContextValue | null>(null);

function resolveColorTheme(scheme: ColorSchemeName | null): ColorTheme {
  return scheme === "dark" ? "dark" : "light";
}

export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const colorTheme = resolveColorTheme(systemScheme);

  const value = useMemo<ColorThemeContextValue>(
    () => ({
      colorTheme,
      colors: COLORS[colorTheme === "dark" ? "Dark" : "Light"],
    }),
    [colorTheme],
  );

  return (
    <ColorThemeContext.Provider value={value}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme(): ThemeColors {
  const ctx = useContext(ColorThemeContext);
  if (ctx == null) {
    throw new Error("useColorTheme must be used within ColorThemeProvider");
  }
  return ctx.colors;
}

export function useColorThemePreference(): ColorTheme {
  const ctx = useContext(ColorThemeContext);
  if (ctx == null) {
    throw new Error(
      "useColorThemePreference must be used within ColorThemeProvider",
    );
  }
  return ctx.colorTheme;
}
