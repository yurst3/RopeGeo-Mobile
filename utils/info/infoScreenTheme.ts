import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useMemo } from "react";
import { StyleSheet, type ViewStyle } from "react-native";

/** Fixed width for the badge column on info screens. */
export const INFO_BADGE_COLUMN_WIDTH = 80;

const layout = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  titleRow: {
    minHeight: 44,
    justifyContent: "center",
    marginBottom: 12,
  },
  subtitle: {
    marginBottom: 24,
  },
  cClassNote: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
  },
  rowHighlightPadding: {
    marginHorizontal: -12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  badgeWrap: {
    width: INFO_BADGE_COLUMN_WIDTH,
    flexShrink: 0,
    alignItems: "center",
  },
  descriptionWrap: {
    flex: 1,
    minWidth: 0,
  },
  minimumFor: {
    marginBottom: 4,
  },
});

export type InfoScreenStyles = {
  screen: ViewStyle;
  scroll: ViewStyle;
  content: ViewStyle;
  titleRow: ViewStyle;
  subtitle: ViewStyle;
  cClassNote: ViewStyle;
  row: ViewStyle;
  rowHighlighted: ViewStyle;
  badgeWrap: ViewStyle;
  descriptionWrap: ViewStyle;
  minimumFor: ViewStyle;
};

export function useInfoScreenStyles(): InfoScreenStyles {
  const { background, cardHighlight } = useColorTheme();

  return useMemo(
    () => ({
      screen: { ...layout.screen, backgroundColor: background },
      scroll: { ...layout.scroll, backgroundColor: background },
      content: layout.content,
      titleRow: layout.titleRow,
      subtitle: layout.subtitle,
      cClassNote: layout.cClassNote,
      row: layout.row,
      rowHighlighted: {
        ...layout.row,
        ...layout.rowHighlightPadding,
        backgroundColor: cardHighlight,
      },
      badgeWrap: layout.badgeWrap,
      descriptionWrap: layout.descriptionWrap,
      minimumFor: layout.minimumFor,
    }),
    [background, cardHighlight],
  );
}
