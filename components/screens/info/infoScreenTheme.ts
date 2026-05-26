import { useColorTheme } from "@/context/ColorThemeContext";
import { useMemo } from "react";
import { StyleSheet, type TextStyle, type ViewStyle } from "react-native";

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
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
    lineHeight: 22,
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
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  minimumFor: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
});

export type InfoScreenStyles = {
  screen: ViewStyle;
  scroll: ViewStyle;
  content: ViewStyle;
  titleRow: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  cClassNote: ViewStyle;
  cClassNoteText: TextStyle;
  row: ViewStyle;
  rowHighlighted: ViewStyle;
  badgeWrap: ViewStyle;
  descriptionWrap: ViewStyle;
  body: TextStyle;
  minimumFor: TextStyle;
};

export function useInfoScreenStyles(): InfoScreenStyles {
  const { background, cardHighlight, text } = useColorTheme();

  return useMemo(
    () => ({
      screen: { ...layout.screen, backgroundColor: background },
      scroll: { ...layout.scroll, backgroundColor: background },
      content: layout.content,
      titleRow: layout.titleRow,
      title: { ...layout.title, color: text.primary },
      subtitle: { ...layout.subtitle, color: text.secondary },
      cClassNote: layout.cClassNote,
      cClassNoteText: { ...layout.subtitle, color: text.secondary },
      row: layout.row,
      rowHighlighted: {
        ...layout.row,
        ...layout.rowHighlightPadding,
        backgroundColor: cardHighlight,
      },
      badgeWrap: layout.badgeWrap,
      descriptionWrap: layout.descriptionWrap,
      body: { ...layout.body, color: text.secondary },
      minimumFor: { ...layout.minimumFor, color: text.primary },
    }),
    [background, cardHighlight, text.primary, text.secondary],
  );
}
