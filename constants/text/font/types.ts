/** Maps to {@link FontProfile} slot entries; typography roles pick a slot for typeface. */
export type FontSlot = "display" | "body" | "ui";

/**
 * Loaded typeface for a slot. Omit {@link fontFamily} to use the platform system default
 * (San Francisco on iOS, Roboto on Android).
 */
export type FontSlotDefinition = {
  /**
   * RN `fontFamily` PostScript name after build-time embedding via the expo-font
   * config plugin (e.g. `Roboto-Regular`, `Merriweather-Bold`).
   */
  fontFamily?: string;
};

export type FontProfile = {
  display: FontSlotDefinition;
  body: FontSlotDefinition;
  ui: FontSlotDefinition;
};

export type FontProfileKey =
  | "Auto"
  | "Roboto"
  | "Merriweather"
  | "ComicNeue"
  | "DancingScript";
