import { ConstantText } from "@/components/text/ConstantText";
import {
  formatBannerImageAuthors,
  formatImageAuthors,
  formatMapDataAuthors,
  formatPageAuthors,
} from "@/constants/ropewikiAttribution";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import React from "react";
import { StyleSheet, type StyleProp, type TextStyle } from "react-native";

export type AttributionAuthorsKind = "page" | "map" | "image" | "banner";

export type AttributionAuthorsTextProps = {
  authors: string[] | null | undefined;
  /**
   * Adds credit wording for page / map / image / banner (known or unknown author).
   * Defaults to `page`.
   */
  kind?: AttributionAuthorsKind;
  /** Defaults to right for image/map credits; page footer uses left as needed. */
  textAlign?: "left" | "right" | "center";
  style?: StyleProp<TextStyle>;
};

function formatAuthorsForKind(
  kind: AttributionAuthorsKind,
  authors: string[] | null | undefined,
): string {
  switch (kind) {
    case "map":
      return formatMapDataAuthors(authors);
    case "image":
      return formatImageAuthors(authors);
    case "banner":
      return formatBannerImageAuthors(authors);
    case "page":
      return formatPageAuthors(authors);
  }
}

/**
 * Meta-sized author credit line. Always renders; uses unknown-author fallback
 * when authors are missing.
 */
export function AttributionAuthorsText({
  authors,
  kind = "page",
  textAlign = "right",
  style,
}: AttributionAuthorsTextProps) {
  const { text } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();

  return (
    <ConstantText
      size={uiScale.pageScreen.text.metaData}
      typography={textStyle.pageScreen.metaData}
      style={[
        styles.authors,
        { color: text.secondary, textAlign },
        style,
      ]}
    >
      {formatAuthorsForKind(kind, authors)}
    </ConstantText>
  );
}

const styles = StyleSheet.create({
  authors: {},
});
