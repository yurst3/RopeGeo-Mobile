/** Asset filenames registered by the expo-font config plugin. */
export const EMBEDDED_FONT_FILES = [
  "./assets/fonts/Roboto_400Regular.ttf",
  "./assets/fonts/Roboto_700Bold.ttf",
  "./assets/fonts/Merriweather_400Regular.ttf",
  "./assets/fonts/Merriweather_700Bold.ttf",
  "./assets/fonts/ComicNeue_400Regular.ttf",
  "./assets/fonts/ComicNeue_700Bold.ttf",
  "./assets/fonts/DancingScript_400Regular.ttf",
  "./assets/fonts/DancingScript_700Bold.ttf",
] as const;

/** PostScript names to use as RN `fontFamily` after build-time embedding. */
export const EMBEDDED_FONT_POSTSCRIPT_NAMES = [
  "Roboto-Regular",
  "Roboto-Bold",
  "Merriweather-Regular",
  "Merriweather-Bold",
  "ComicNeue-Regular",
  "ComicNeue-Bold",
  "DancingScript-Regular",
  "DancingScript-Bold",
] as const;
