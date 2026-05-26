import { darkTheme } from "./darkTheme";
import { lightTheme } from "./lightTheme";
import type { ThemeColors } from "./types";

export const COLORS: Record<string, ThemeColors> = {
  Dark: darkTheme,
  Light: lightTheme,
};
