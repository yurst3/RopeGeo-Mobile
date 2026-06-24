import { darkTheme } from "./darkTheme";
import { fabulousTheme } from "./fabulousTheme";
import { lightTheme } from "./lightTheme";
import type { ThemeColors } from "./types";

/** Registry key for each named palette (matches {@link ThemePreference} except `Auto`). */
export type ThemePaletteKey = "Light" | "Dark" | "Fabulous";

export const COLORS: Record<ThemePaletteKey, ThemeColors> = {
  Light: lightTheme,
  Dark: darkTheme,
  Fabulous: fabulousTheme,
};

export type { ThemeColors } from "./types";
