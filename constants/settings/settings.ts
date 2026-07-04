import type { FontProfileKey } from "@/constants/text/font/types";
import type { UiScaleProfileKey } from "@/constants/uiScale/types";
import type {
  LengthMeasurementSystem,
  TimeMeasurementSystem,
} from "ropegeo-common/models";
import {
  LENGTH_MEASUREMENT_SYSTEMS,
  SETTINGS_FONT_KEYS,
  SETTINGS_UI_SCALE_KEYS,
  THEME_PREFERENCES,
  TIME_MEASUREMENT_SYSTEMS,
  type ThemePreference,
  type UnitsPreference,
} from "./types";

export class Settings {
  theme: ThemePreference;
  font: FontProfileKey;
  uiScale: UiScaleProfileKey;
  lengthMeasurementSystem: LengthMeasurementSystem;
  timeMeasurementSystem: TimeMeasurementSystem;

  constructor(
    theme: ThemePreference = "Auto",
    font: FontProfileKey = "Auto",
    uiScale: UiScaleProfileKey = "Auto",
    lengthMeasurementSystem: LengthMeasurementSystem = "Imperial",
    timeMeasurementSystem: TimeMeasurementSystem = "Standard",
  ) {
    this.theme = theme;
    this.font = font;
    this.uiScale = uiScale;
    this.lengthMeasurementSystem = lengthMeasurementSystem;
    this.timeMeasurementSystem = timeMeasurementSystem;
  }

  setTheme(v: ThemePreference): void {
    this.theme = v;
  }

  setFont(v: FontProfileKey): void {
    this.font = v;
  }

  setUiScale(v: UiScaleProfileKey): void {
    this.uiScale = v;
  }

  /**
   * Applies a "Units" selection: the length system matches the choice, and the
   * time system is Freedom only when Freedom units are selected (otherwise Standard).
   */
  setUnits(units: UnitsPreference): void {
    this.lengthMeasurementSystem = units;
    this.timeMeasurementSystem = units === "Freedom" ? "Freedom" : "Standard";
  }

  toJSON(): Record<string, unknown> {
    return {
      theme: this.theme,
      font: this.font,
      uiScale: this.uiScale,
      lengthMeasurementSystem: this.lengthMeasurementSystem,
      timeMeasurementSystem: this.timeMeasurementSystem,
    };
  }

  toString(): string {
    return JSON.stringify(this.toJSON());
  }

  static fromJsonString(json: string): Settings {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      throw new Error(
        `Settings.fromJsonString: invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
    return Settings.fromJSON(parsed);
  }

  static fromJSON(parsed: unknown): Settings {
    if (parsed == null || typeof parsed !== "object") {
      throw new Error("Settings must be a JSON object");
    }
    const o = parsed as Record<string, unknown>;
    return new Settings(
      Settings.parseTheme(o.theme),
      Settings.parseFont(o.font),
      Settings.parseUiScale(o.uiScale),
      Settings.parseLengthMeasurementSystem(o.lengthMeasurementSystem),
      Settings.parseTimeMeasurementSystem(o.timeMeasurementSystem),
    );
  }

  private static parseTheme(v: unknown): ThemePreference {
    if (v === undefined) return "Auto";
    if (THEME_PREFERENCES.includes(v as ThemePreference)) {
      return v as ThemePreference;
    }
    throw new Error(`Invalid Settings.theme: ${JSON.stringify(v)}`);
  }

  private static parseFont(v: unknown): FontProfileKey {
    if (v === undefined) return "Auto";
    if (SETTINGS_FONT_KEYS.includes(v as FontProfileKey)) {
      return v as FontProfileKey;
    }
    throw new Error(`Invalid Settings.font: ${JSON.stringify(v)}`);
  }

  private static parseUiScale(v: unknown): UiScaleProfileKey {
    if (v === undefined) return "Auto";
    if (SETTINGS_UI_SCALE_KEYS.includes(v as UiScaleProfileKey)) {
      return v as UiScaleProfileKey;
    }
    throw new Error(`Invalid Settings.uiScale: ${JSON.stringify(v)}`);
  }

  private static parseLengthMeasurementSystem(
    v: unknown,
  ): LengthMeasurementSystem {
    if (v === undefined) return "Imperial";
    if (LENGTH_MEASUREMENT_SYSTEMS.includes(v as LengthMeasurementSystem)) {
      return v as LengthMeasurementSystem;
    }
    throw new Error(`Invalid Settings.lengthMeasurementSystem: ${JSON.stringify(v)}`);
  }

  private static parseTimeMeasurementSystem(v: unknown): TimeMeasurementSystem {
    if (v === undefined) return "Standard";
    if (TIME_MEASUREMENT_SYSTEMS.includes(v as TimeMeasurementSystem)) {
      return v as TimeMeasurementSystem;
    }
    throw new Error(`Invalid Settings.timeMeasurementSystem: ${JSON.stringify(v)}`);
  }
}
