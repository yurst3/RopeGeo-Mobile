import { useColorTheme } from "@/context/ColorThemeContext";
import { useText } from "@/context/TextContext";
import {
  useResolvedConstantSize,
  useResolvedTypography,
} from "@/utils/resolvers";
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
  const { uiScale, style } = useText();

  const titleSize = useResolvedConstantSize(uiScale.infoScreen.text.title);
  const titleTypography = useResolvedTypography(style.infoScreen.title);
  const descriptionSize = useResolvedConstantSize(uiScale.infoScreen.text.description);
  const descriptionTypography = useResolvedTypography(style.infoScreen.description);
  const badgeDescriptionSize = useResolvedConstantSize(
    uiScale.infoScreen.text.badgeDescription,
  );
  const badgeDescriptionTypography = useResolvedTypography(
    style.infoScreen.badgeDescription,
  );
  const badgeDescriptionHeaderSize = useResolvedConstantSize(
    uiScale.infoScreen.text.badgeDescriptionHeader,
  );
  const badgeDescriptionHeaderTypography = useResolvedTypography(
    style.infoScreen.badgeDescriptionHeader,
  );

  return useMemo(
    () => ({
      screen: { ...layout.screen, backgroundColor: background },
      scroll: { ...layout.scroll, backgroundColor: background },
      content: layout.content,
      titleRow: layout.titleRow,
      title: {
        ...titleTypography,
        fontSize: titleSize,
        color: text.primary,
      },
      subtitle: {
        ...descriptionTypography,
        fontSize: descriptionSize,
        color: text.secondary,
        ...layout.subtitle,
      },
      cClassNote: layout.cClassNote,
      cClassNoteText: {
        ...descriptionTypography,
        fontSize: descriptionSize,
        color: text.secondary,
      },
      row: layout.row,
      rowHighlighted: {
        ...layout.row,
        ...layout.rowHighlightPadding,
        backgroundColor: cardHighlight,
      },
      badgeWrap: layout.badgeWrap,
      descriptionWrap: layout.descriptionWrap,
      body: {
        ...badgeDescriptionTypography,
        fontSize: badgeDescriptionSize,
        color: text.secondary,
      },
      minimumFor: {
        ...badgeDescriptionHeaderTypography,
        fontSize: badgeDescriptionHeaderSize,
        color: text.primary,
        ...layout.minimumFor,
      },
    }),
    [
      background,
      badgeDescriptionHeaderSize,
      badgeDescriptionHeaderTypography,
      badgeDescriptionSize,
      badgeDescriptionTypography,
      cardHighlight,
      descriptionSize,
      descriptionTypography,
      text.primary,
      text.secondary,
      titleSize,
      titleTypography,
    ],
  );
}
