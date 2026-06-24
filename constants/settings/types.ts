import type { FontProfileKey } from "@/constants/text/font/types";
import type { UiScaleProfileKey } from "@/constants/uiScale/types";

export type ThemePreference = "Auto" | "Light" | "Dark" | "Fabulous";

export type SettingsFontKey = FontProfileKey;
export type SettingsUiScaleKey = UiScaleProfileKey;

export const THEME_PREFERENCES: readonly ThemePreference[] = [
  "Auto",
  "Light",
  "Dark",
  "Fabulous",
];

export const SETTINGS_FONT_KEYS: readonly SettingsFontKey[] = [
  "Auto",
  "Roboto",
  "Merriweather",
  "ComicNeue",
  "DancingScript",
];

export const SETTINGS_UI_SCALE_KEYS: readonly SettingsUiScaleKey[] = [
  "Auto",
  "Small",
  "Medium",
  "Large",
];
