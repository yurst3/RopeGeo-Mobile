import type { ThemeColors } from "@/constants/colors/types";
import { FontSizeStep } from "@/constants/uiScale/types";
import {
  HTMLContentModel,
  HTMLElementModel,
  type HTMLElementModelRecord,
  type CSSPropertyNameList,
  type MixedStyleRecord,
} from "react-native-render-html";

/** Inline `color` from `style=""` must not override {@link ThemeColors.text.link}; use `<font color>` instead. */
export const ROPEWIKI_HTML_IGNORED_STYLES: CSSPropertyNameList = ["color"];

/** Token-driven HTML must not apply system font scaling on top of resolvers. */
export const ROPEWIKI_HTML_DEFAULT_TEXT_PROPS = {
  allowFontScaling: false,
} as const;

/** Legacy `<font color="…">` (common in Ropewiki beta HTML). */
function normalizeFontTagColor(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (/^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(value)) {
    return `#${value}`;
  }
  return value;
}

export const ROPEWIKI_CUSTOM_HTML_ELEMENT_MODELS: HTMLElementModelRecord = {
  font: HTMLElementModel.fromCustomModel({
    tagName: "font",
    contentModel: HTMLContentModel.textual,
    getMixedUAStyles: ({ attributes }) => {
      const raw = attributes.color;
      if (typeof raw !== "string") return undefined;
      const color = normalizeFontTagColor(raw);
      return color != null ? { color } : undefined;
    },
  }),
};

export type RopewikiHtmlTagsStyleColors = Pick<ThemeColors["text"], "link" | "secondary"> & {
  /** Defaults to {@link ThemeColors.text.secondary}. */
  captionColor?: string;
  /**
   * Resolved via {@link useResolvedConstantTextSize} on `uiScale.betaSection.text.caption`.
   * Defaults to {@link FontSizeStep.MEDIUM} when omitted.
   */
  captionFontSize?: number;
  /** Defaults to `center` (expanded image overlay). */
  captionTextAlign?: "left" | "center" | "right";
  /** Resolved body copy size; normalizes block/heading tags to the body token. */
  bodyFontSize?: number;
};

export function buildRopewikiHtmlTagsStyles({
  link,
  secondary,
  captionColor,
  captionFontSize = FontSizeStep.MEDIUM,
  captionTextAlign = "center",
  bodyFontSize,
}: RopewikiHtmlTagsStyleColors): MixedStyleRecord {
  return {
    a: {
      color: link,
      textDecorationLine: "underline" as const,
    },
    b: { fontWeight: "700" as const },
    strong: { fontWeight: "700" as const },
    i: { fontStyle: "italic" as const },
    em: { fontStyle: "italic" as const },
    ...(bodyFontSize != null
      ? {
          p: { fontSize: bodyFontSize },
          div: { fontSize: bodyFontSize },
          h1: { fontSize: bodyFontSize, fontWeight: "700" as const },
          h2: { fontSize: bodyFontSize, fontWeight: "700" as const },
          h3: { fontSize: bodyFontSize, fontWeight: "700" as const },
          h4: { fontSize: bodyFontSize, fontWeight: "700" as const },
          h5: { fontSize: bodyFontSize, fontWeight: "700" as const },
          h6: { fontSize: bodyFontSize, fontWeight: "700" as const },
        }
      : {}),
    caption: {
      textAlign: captionTextAlign,
      fontSize: captionFontSize,
      color: captionColor ?? secondary,
    },
  } as MixedStyleRecord;
}
