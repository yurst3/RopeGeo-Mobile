import type { FontProfileKey } from "@/constants/text/font/types";
import type { UiScaleProfileKey } from "@/constants/uiScale/types";
import type {
  LengthMeasurementSystem,
  TimeMeasurementSystem,
} from "ropegeo-common/models";

export type ThemePreference = "Auto" | "Light" | "Dark" | "Fabulous";

export type SettingsFontKey = FontProfileKey;
export type SettingsUiScaleKey = UiScaleProfileKey;

/**
 * The user-facing "Units" choice. It maps directly to the length measurement
 * system; the time measurement system is derived from it (Freedom → Freedom,
 * otherwise Standard).
 */
export type UnitsPreference = LengthMeasurementSystem;

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

export const UNITS_PREFERENCES: readonly UnitsPreference[] = [
  "Imperial",
  "Metric",
  "Freedom",
];

export const LENGTH_MEASUREMENT_SYSTEMS: readonly LengthMeasurementSystem[] = [
  "Imperial",
  "Metric",
  "Freedom",
];

export const TIME_MEASUREMENT_SYSTEMS: readonly TimeMeasurementSystem[] = [
  "Standard",
  "Freedom",
];
