import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import RenderHtml from "react-native-render-html";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type {
  OfflineBetaSection,
  OnlineBetaSection,
} from "ropegeo-common/models";
import { ROPEWIKI_ORIGIN } from "@/constants/ropewikiOrigin";
import { useColorTheme } from "@/context/ColorThemeContext";
import { replaceEmbeddedImgTagsWithLinks } from "@/utils/replaceEmbeddedImgTagsWithLinks";
import {
  buildRopewikiHtmlTagsStyles,
  ROPEWIKI_HTML_IGNORED_STYLES,
} from "@/utils/ropewikiRenderHtml";
import { BetaSectionImages } from "./BetaSectionImages";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_PADDING_HORIZONTAL = 20;
const CONTENT_WIDTH = SCREEN_WIDTH - CARD_PADDING_HORIZONTAL * 2;
const TEXT_MAX_HEIGHT = 150;
const EXPAND_COLLAPSE_MS = 280;

type HtmlSource = { html: string; baseUrl: string };

/** Owns expand + measure state so a `key` on this block resets cleanly when `section.text` changes. */
function CollapsibleHtmlBlock({ htmlSource }: { htmlSource: HtmlSource }) {
  const themeColors = useColorTheme();
  const htmlTagsStyles = useMemo(
    () => buildRopewikiHtmlTagsStyles(themeColors.text),
    [themeColors.text],
  );
  const [textExpanded, setTextExpanded] = useState(false);
  const [fullContentHeight, setFullContentHeight] = useState(0);
  const maxHeight = useSharedValue(TEXT_MAX_HEIGHT);
  const firstMeasureRef = useRef(true);

  useEffect(() => {
    if (fullContentHeight === 0) return;
    const needsClamp = fullContentHeight >= TEXT_MAX_HEIGHT;
    const target =
      !needsClamp || textExpanded ? fullContentHeight : TEXT_MAX_HEIGHT;
    if (firstMeasureRef.current) {
      maxHeight.value = target;
      firstMeasureRef.current = false;
      return;
    }
    maxHeight.value = withTiming(target, {
      duration: EXPAND_COLLAPSE_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [textExpanded, fullContentHeight]);

  const animatedTextClipStyle = useAnimatedStyle(() => ({
    maxHeight: maxHeight.value,
    overflow: "hidden" as const,
  }));

  const showExpandButton = fullContentHeight >= TEXT_MAX_HEIGHT;

  return (
    <View style={styles.textBlock}>
      <Animated.View style={[styles.textContent, animatedTextClipStyle]}>
        <ScrollView
          scrollEnabled={false}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.htmlMeasureScrollContent}
          onContentSizeChange={(_, h) => {
            if (h > 0) setFullContentHeight(h);
          }}
        >
          <RenderHtml
            contentWidth={CONTENT_WIDTH}
            source={htmlSource}
            baseStyle={{
              ...styles.htmlBase,
              color: themeColors.text.primary,
            }}
            tagsStyles={htmlTagsStyles}
            ignoredStyles={ROPEWIKI_HTML_IGNORED_STYLES}
            enableUserAgentStyles={false}
          />
        </ScrollView>
      </Animated.View>
      {(showExpandButton || textExpanded) && (
        <Pressable
          onPress={() => setTextExpanded((e) => !e)}
          style={styles.showMoreButton}
          accessibilityLabel={textExpanded ? "Show less" : "Show more"}
        >
          <Text
            style={[styles.showMoreText, { color: themeColors.text.link }]}
          >
            {textExpanded ? "Show less" : "Show more"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export type BetaSectionProps = {
  section: OnlineBetaSection | OfflineBetaSection;
  /** Page or region name for expanded image header (bold top line). */
  pageTitle: string;
};

export function BetaSection({ section, pageTitle }: BetaSectionProps) {
  const themeColors = useColorTheme();
  const hasImages = section.images.length > 0;
  const sortedImages = hasImages
    ? [...section.images].sort((a, b) => a.order - b.order)
    : [];

  const htmlSource = useMemo(
    () => ({
      html: replaceEmbeddedImgTagsWithLinks(section.text || ""),
      baseUrl: ROPEWIKI_ORIGIN,
    }),
    [section.text],
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: themeColors.text.primary }]}>
        {section.title}
      </Text>

      {section.text ? (
        <CollapsibleHtmlBlock key={section.text} htmlSource={htmlSource} />
      ) : null}

      {hasImages && sortedImages.length > 0 && (
        <BetaSectionImages
          images={sortedImages}
          pageTitle={pageTitle}
          sectionTitle={section.title}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  textBlock: {
    marginBottom: 16,
  },
  textContent: {},
  htmlMeasureScrollContent: {
    width: CONTENT_WIDTH,
  },
  htmlBase: {
    fontSize: 15,
    lineHeight: 22,
  },
  showMoreButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  showMoreText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
