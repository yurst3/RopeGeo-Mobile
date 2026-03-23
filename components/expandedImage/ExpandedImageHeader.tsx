import { StyleSheet, Text, View } from "react-native";
import { BackButton } from "@/components/buttons/BackButton";

const BACK_SLOT_WIDTH = 52; /* 44px button + 8px breathing room, aligned with app headers */

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
  top,
}: ExpandedImageHeaderProps) {
  const trimmedSubtitle = sectionSubtitle?.trim() ?? "";
  const showSubtitle = trimmedSubtitle.length > 0;
  const sectionLine =
    showSubtitle && sectionImagePosition != null
      ? `${trimmedSubtitle} (${sectionImagePosition.current}/${sectionImagePosition.total})`
      : trimmedSubtitle;

  return (
    <View style={[styles.row, { top }]} pointerEvents="box-none">
      <View style={[styles.sideSlot, { width: BACK_SLOT_WIDTH }]}>
        <BackButton onPress={onBack} />
      </View>
      <View style={styles.titleSlot} pointerEvents="none">
        <View style={styles.titlePill}>
          <Text
            style={styles.pageTitle}
            numberOfLines={showSubtitle ? 2 : 1}
          >
            {pageTitle}
          </Text>
          {showSubtitle ? (
            <Text style={styles.sectionSubtitle} numberOfLines={2}>
              {sectionLine}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={{ width: BACK_SLOT_WIDTH }} />
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
    alignItems: "flex-start",
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
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  },
  sectionSubtitle: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(255,255,255,0.88)",
    textAlign: "center",
  },
});
