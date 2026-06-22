/** Maps to {@link FontProfile} slot entries; typography roles pick a slot for typeface. */
export type FontSlot = "display" | "body" | "ui";

/**
 * Loaded typeface for a slot. Omit {@link fontFamily} to use the platform system default
 * (San Francisco on iOS, Roboto on Android).
 */
export type FontSlotDefinition = {
  /**
   * RN `fontFamily` string after loading via expo-font (e.g. `Roboto_400Regular`).
   * Matches export names from `@expo-google-fonts/*` packages.
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
