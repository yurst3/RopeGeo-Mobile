import React, { useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import RenderHtml from "react-native-render-html";
import type { BetaSection as BetaSectionType } from "ropegeo-common";
import { BetaSectionImages } from "./BetaSectionImages";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_PADDING_HORIZONTAL = 20;
const CONTENT_WIDTH = SCREEN_WIDTH - CARD_PADDING_HORIZONTAL * 2;
const TEXT_MAX_HEIGHT = 150;

const HTML_TAGS_STYLES = {
  a: {
    color: "#3b82f6",
    textDecorationLine: "underline" as const,
  },
  b: { fontWeight: "700" as const },
  strong: { fontWeight: "700" as const },
  i: { fontStyle: "italic" as const },
  em: { fontStyle: "italic" as const },
  caption: {
    textAlign: "center" as const,
    fontSize: 14,
    color: "#6b7280",
  },
};

export type BetaSectionProps = {
  section: BetaSectionType;
};

export function BetaSection({ section }: BetaSectionProps) {
  const [textExpanded, setTextExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const hasImages = section.images != null && section.images.length > 0;
  const sortedImages = hasImages
    ? [...section.images].sort((a, b) => a.order - b.order)
    : [];

  const htmlSource = { html: section.text || "" };

  const handleTextLayout = (e: { nativeEvent: { layout: { height: number } } }) => {
    if (textExpanded) return;
    const { height } = e.nativeEvent.layout;
    setShowExpandButton(height >= TEXT_MAX_HEIGHT);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{section.title}</Text>

      {section.text ? (
        <View style={styles.textBlock}>
          <View
            style={[
              styles.textContent,
              !textExpanded && styles.textContentCollapsed,
            ]}
            onLayout={handleTextLayout}
          >
            <RenderHtml
              contentWidth={CONTENT_WIDTH}
              source={htmlSource}
              baseStyle={styles.htmlBase}
              tagsStyles={HTML_TAGS_STYLES}
            />
          </View>
          {(showExpandButton || textExpanded) && (
            <Pressable
              onPress={() => setTextExpanded((e) => !e)}
              style={styles.showMoreButton}
              accessibilityLabel={textExpanded ? "Show less" : "Show more"}
            >
              <Text style={styles.showMoreText}>
                {textExpanded ? "Show less" : "Show more"}
              </Text>
            </Pressable>
          )}
        </View>
      ) : null}

      {hasImages && sortedImages.length > 0 && (
        <BetaSectionImages images={sortedImages} />
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
    color: "#000",
    marginBottom: 12,
  },
  textBlock: {
    marginBottom: 16,
  },
  textContent: {
    overflow: "hidden",
  },
  textContentCollapsed: {
    maxHeight: TEXT_MAX_HEIGHT,
  },
  htmlBase: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  showMoreButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  showMoreText: {
    fontSize: 15,
    color: "#3b82f6",
    fontWeight: "500",
  },
});
