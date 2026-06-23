import type { FontProfileKey } from "@/constants/text/font/types";
import type { UiScaleProfileKey } from "@/constants/uiScale/types";
import {
  SETTINGS_FONT_KEYS,
  SETTINGS_UI_SCALE_KEYS,
  THEME_PREFERENCES,
  type ThemePreference,
} from "./types";

export class Settings {
  theme: ThemePreference;
  font: FontProfileKey;
  uiScale: UiScaleProfileKey;

  constructor(
    theme: ThemePreference = "Auto",
    font: FontProfileKey = "Auto",
    uiScale: UiScaleProfileKey = "Auto",
  ) {
    this.theme = theme;
    this.font = font;
    this.uiScale = uiScale;
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

  toJSON(): Record<string, unknown> {
    return {
      theme: this.theme,
      font: this.font,
      uiScale: this.uiScale,
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
}
