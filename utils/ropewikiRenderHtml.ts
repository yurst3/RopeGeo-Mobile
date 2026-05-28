import type { ThemeColors } from "@/constants/colors/types";
import {
  HTMLContentModel,
  HTMLElementModel,
  type HTMLElementModelRecord,
  type CSSPropertyNameList,
} from "react-native-render-html";

/** Inline `color` from `style=""` must not override {@link ThemeColors.text.link}; use `<font color>` instead. */
export const ROPEWIKI_HTML_IGNORED_STYLES: CSSPropertyNameList = ["color"];

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
  /** Defaults to 14. */
  captionFontSize?: number;
};

export function buildRopewikiHtmlTagsStyles({
  link,
  secondary,
  captionColor,
  captionFontSize = 14,
}: RopewikiHtmlTagsStyleColors) {
  return {
    a: {
      color: link,
      textDecorationLine: "underline" as const,
    },
    b: { fontWeight: "700" as const },
    strong: { fontWeight: "700" as const },
    i: { fontStyle: "italic" as const },
    em: { fontStyle: "italic" as const },
    caption: {
      textAlign: "center" as const,
      fontSize: captionFontSize,
      color: captionColor ?? secondary,
    },
  };
}
