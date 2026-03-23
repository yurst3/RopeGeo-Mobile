import { ScrollView, StyleSheet, View } from "react-native";
import RenderHtml from "react-native-render-html";
import { ROPEWIKI_ORIGIN } from "@/constants/ropewikiOrigin";
import { replaceEmbeddedImgTagsWithLinks } from "@/utils/replaceEmbeddedImgTagsWithLinks";

const HORIZONTAL_INSET = 16;
const CAPTION_PILL_PADDING_H = 12;
const CAPTION_PILL_PADDING_V = 8;
const CAPTION_PILL_RADIUS = 12;

const EXPANDED_CAPTION_HTML_TAGS = {
  a: {
    color: "#93c5fd",
    textDecorationLine: "underline" as const,
  },
  b: { fontWeight: "700" as const },
  strong: { fontWeight: "700" as const },
  i: { fontStyle: "italic" as const },
  em: { fontStyle: "italic" as const },
  caption: {
    textAlign: "center" as const,
    fontSize: 15,
    color: "#ffffff",
  },
};

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
  /** Bottom edge of the contained full image (stage coordinates). Caption region starts here. */
  imageBottomY: number;
  /** Padding from the bottom of the stage (e.g. safe area). */
  bottomInset: number;
};

/**
 * Expanded image caption: white HTML on a subtle dark pill.
 * Vertically centered in the band between the image bottom and the stage bottom.
 */
export function ExpandedImageCaption({
  caption,
  stageWidth,
  imageBottomY,
  bottomInset,
}: ExpandedImageCaptionProps) {
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
          top: imageBottomY,
          left: HORIZONTAL_INSET,
          right: HORIZONTAL_INSET,
          bottom: bottomInset,
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
        <View style={styles.captionPill}>
          <RenderHtml
            contentWidth={pillInnerWidth}
            source={{
              html: replaceEmbeddedImgTagsWithLinks(caption),
              baseUrl: ROPEWIKI_ORIGIN,
            }}
            baseStyle={styles.htmlBase}
            tagsStyles={EXPANDED_CAPTION_HTML_TAGS}
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
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 4,
  },
  captionPill: {
    maxWidth: "100%",
    paddingVertical: CAPTION_PILL_PADDING_V,
    paddingHorizontal: CAPTION_PILL_PADDING_H,
    borderRadius: CAPTION_PILL_RADIUS,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  htmlBase: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
