import type { FontProfile, FontProfileKey } from "./types";

export type { FontProfile, FontProfileKey, FontSlot, FontSlotDefinition } from "./types";

export { autoFontProfile } from "./profiles/auto";
export { comicNeueFontProfile } from "./profiles/comic-neue";
export { dancingScriptFontProfile } from "./profiles/dancing-script";
export { merriweatherFontProfile } from "./profiles/merriweather";
export { robotoFontProfile } from "./profiles/roboto";

import { autoFontProfile } from "./profiles/auto";
import { comicNeueFontProfile } from "./profiles/comic-neue";
import { dancingScriptFontProfile } from "./profiles/dancing-script";
import { merriweatherFontProfile } from "./profiles/merriweather";
import { robotoFontProfile } from "./profiles/roboto";

/** Typeface profiles; mix-and-match with {@link UI_SCALE_PROFILES}. */
export const FONT_PROFILES: Record<FontProfileKey, FontProfile> = {
  Auto: autoFontProfile,
  Roboto: robotoFontProfile,
  Merriweather: merriweatherFontProfile,
  ComicNeue: comicNeueFontProfile,
  DancingScript: dancingScriptFontProfile,
};
