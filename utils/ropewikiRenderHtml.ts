import type { ThemeColors } from "@/constants/colors/types";
import type { CSSPropertyNameList } from "react-native-render-html";

/** Inline `color` from Ropewiki HTML must not override {@link ThemeColors.text.link}. */
export const ROPEWIKI_HTML_IGNORED_STYLES: CSSPropertyNameList = ["color"];

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
