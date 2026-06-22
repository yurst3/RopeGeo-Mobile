import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import RenderHtml from "react-native-render-html";
import { ROPEWIKI_ORIGIN } from "@/constants/ropewikiOrigin";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useText } from "@/context/TextContext";
import { replaceEmbeddedImgTagsWithLinks } from "@/utils/replaceEmbeddedImgTagsWithLinks";
import {
  buildRopewikiHtmlTagsStyles,
  ROPEWIKI_CUSTOM_HTML_ELEMENT_MODELS,
  ROPEWIKI_HTML_DEFAULT_TEXT_PROPS,
  ROPEWIKI_HTML_IGNORED_STYLES,
} from "@/utils/ropewikiRenderHtml";
import {
  useResolvedConstantSize,
  useResolvedTypography,
} from "@/utils/resolvers";

const HORIZONTAL_INSET = 16;
const CAPTION_PILL_PADDING_H = 12;
const CAPTION_PILL_PADDING_V = 8;
const CAPTION_PILL_RADIUS = 12;

/** Y coordinate (from stage top) of the bottom edge of a `contentFit="contain"` image. */
export function containImageBottomY(
  stageW: number,
  stageH: number,
  imgW: number,
  imgH: number,
): number | null {
  if (stageW <= 0 || stageH <= 0 || imgW <= 0 || imgH <= 0) return null;
  const scale = Math.min(stageW / imgW, stageH / imgH);
  const dispH = imgH * scale;
  const topOffset = (stageH - dispH) / 2;
  return topOffset + dispH;
}

export type ExpandedImageCaptionProps = {
  /** Raw caption HTML from the API (wiki fragment). */
  caption: string;
  /** Width of the expanded image stage (full-bleed area behind the caption). */
  stageWidth: number;
  /** Padding from the bottom of the stage (e.g. safe area). */
  bottomInset: number;
  /** Max height for the caption region; content scrolls when exceeded. */
  maxHeight: number;
};

/**
 * Expanded image caption: themed HTML on a semi-transparent pill.
 * Anchored a fixed distance from the bottom of the stage (may overlap the image).
 */
export function ExpandedImageCaption({
  caption,
  stageWidth,
  bottomInset,
  maxHeight,
}: ExpandedImageCaptionProps) {
  const themeColors = useColorTheme();
  const { uiScale, style: textStyle } = useText();
  const captionFontSize = useResolvedConstantSize(uiScale.betaSection.text.caption);
  const captionTypography = useResolvedTypography(textStyle.betaSection.caption);
  const captionTagsStyles = useMemo(
    () =>
      buildRopewikiHtmlTagsStyles({
        link: themeColors.text.link,
        secondary: themeColors.text.secondary,
        captionColor: themeColors.image.text,
        captionFontSize,
        bodyFontSize: captionFontSize,
      }),
    [themeColors.image.text, themeColors.text, captionFontSize],
  );
  const contentWidth = Math.max(0, stageWidth - HORIZONTAL_INSET * 2);
  const pillInnerWidth = Math.max(
    0,
    contentWidth - CAPTION_PILL_PADDING_H * 2,
  );
  return (
    <View
      style={[
        styles.region,
        {
          left: HORIZONTAL_INSET,
          right: HORIZONTAL_INSET,
          bottom: bottomInset,
          maxHeight,
        },
      ]}
      pointerEvents="box-none"
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View
          style={[
            styles.captionPill,
            { backgroundColor: themeColors.image.textBackground },
          ]}
        >
          <RenderHtml
            contentWidth={pillInnerWidth}
            source={{
              html: replaceEmbeddedImgTagsWithLinks(caption),
              baseUrl: ROPEWIKI_ORIGIN,
            }}
            baseStyle={{
              fontFamily: captionTypography.fontFamily,
              fontWeight: captionTypography.fontWeight,
              fontSize: captionFontSize,
              textAlign: "center",
              color: themeColors.image.text,
            }}
            tagsStyles={captionTagsStyles}
            customHTMLElementModels={ROPEWIKI_CUSTOM_HTML_ELEMENT_MODELS}
            ignoredStyles={ROPEWIKI_HTML_IGNORED_STYLES}
            enableUserAgentStyles={false}
            defaultTextProps={ROPEWIKI_HTML_DEFAULT_TEXT_PROPS}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  region: {
    position: "absolute",
    alignItems: "center",
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingVertical: 4,
  },
  captionPill: {
    maxWidth: "100%",
    paddingVertical: CAPTION_PILL_PADDING_V,
    paddingHorizontal: CAPTION_PILL_PADDING_H,
    borderRadius: CAPTION_PILL_RADIUS,
  },
});
