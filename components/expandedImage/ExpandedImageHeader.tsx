import { StyleSheet, Text, View } from "react-native";
import { BackButton } from "@/components/buttons/standard/BackButton";
import { ExternalLinkButton } from "@/components/buttons/standard/ExternalLinkButton";
import { useColorTheme } from "@/context/ColorThemeContext";

const SIDE_SLOT_WIDTH = 52; /* 44px button + 8px breathing room, aligned with app headers */

export type ExpandedImageSectionImagePosition = {
  /** 1-based index for display, e.g. `1` in `(1/6)`. */
  current: number;
  total: number;
};

export type ExpandedImageHeaderProps = {
  /** Page or parent context name (bold, top line). */
  pageTitle: string;
  /** Beta section name; when set, shown slightly smaller below `pageTitle`. */
  sectionSubtitle?: string | null;
  /** When set with `sectionSubtitle`, appended as `Title (current/total)`. */
  sectionImagePosition?: ExpandedImageSectionImagePosition | null;
  onBack: () => void;
  /** Ropewiki URL for the current image; omit to hide the external link control. */
  externalLinkUrl?: string | null;
  /** Distance from the top of the screen (typically `insets.top + 8`). */
  top: number;
};

/**
 * Expanded image viewer header: back control + centered title on a subtle dark pill.
 */
export function ExpandedImageHeader({
  pageTitle,
  sectionSubtitle,
  sectionImagePosition,
  onBack,
  externalLinkUrl,
  top,
}: ExpandedImageHeaderProps) {
  const themeColors = useColorTheme();
  const trimmedSubtitle = sectionSubtitle?.trim() ?? "";
  const showSubtitle = trimmedSubtitle.length > 0;
  const trimmedLink = externalLinkUrl?.trim() ?? "";
  const showExternalLink = trimmedLink.length > 0;
  const sectionLine =
    showSubtitle && sectionImagePosition != null
      ? `${trimmedSubtitle} (${sectionImagePosition.current}/${sectionImagePosition.total})`
      : trimmedSubtitle;

  return (
    <View style={[styles.row, { top }]} pointerEvents="box-none">
      <View style={[styles.sideSlot, styles.sideSlotStart, { width: SIDE_SLOT_WIDTH }]}>
        <BackButton onPress={onBack} />
      </View>
      <View style={styles.titleSlot} pointerEvents="none">
        <View
          style={[
            styles.titlePill,
            { backgroundColor: themeColors.image.textBackground },
          ]}
        >
          <Text
            style={[styles.pageTitle, { color: themeColors.image.text }]}
            numberOfLines={showSubtitle ? 2 : 1}
          >
            {pageTitle}
          </Text>
          {showSubtitle ? (
            <Text
              style={[styles.sectionSubtitle, { color: themeColors.image.text }]}
              numberOfLines={2}
            >
              {sectionLine}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={[styles.sideSlot, styles.sideSlotEnd, { width: SIDE_SLOT_WIDTH }]}>
        {showExternalLink ? (
          <ExternalLinkButton
            icon={require("@/assets/images/icons/ropewiki.png")}
            link={trimmedLink}
            accessibilityLabel="Open on RopeWiki"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 3900,
    flexDirection: "row",
    alignItems: "center",
  },
  sideSlot: {
    height: 44,
    justifyContent: "center",
  },
  sideSlotStart: {
    alignItems: "flex-start",
  },
  sideSlotEnd: {
    alignItems: "flex-end",
  },
  titleSlot: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  titlePill: {
    maxWidth: "100%",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  sectionSubtitle: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
});
