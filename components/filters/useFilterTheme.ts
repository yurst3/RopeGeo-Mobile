import { useColorTheme } from "@/context/ColorThemeContext";
import { useMemo } from "react";
import type { TextStyle, ViewStyle } from "react-native";

/** Shared filter sheet / form text and layout tokens from {@link ThemeColors}. */
export function useFilterTheme() {
  const themeColors = useColorTheme();
  const { text, background, cardHighlight, filter } = themeColors;

  return useMemo(
    () => ({
      themeColors,
      text,
      background,
      cardHighlight,
      filter,
      sectionLabel: {
        fontSize: 14,
        fontWeight: "600" as const,
        color: text.secondary,
      } satisfies TextStyle,
      bodyText: {
        fontSize: 15,
        color: text.primary,
      } satisfies TextStyle,
      hintText: {
        fontSize: 13,
        color: text.tertiary,
      } satisfies TextStyle,
      switchLabel: {
        fontSize: 15,
        color: text.primary,
        flex: 1,
        marginRight: 12,
      } satisfies TextStyle,
      switchLabelMuted: {
        fontSize: 15,
        color: text.tertiary,
        flex: 1,
        marginRight: 12,
      } satisfies TextStyle,
      disableSection: {
        backgroundColor: filter.disableSection,
      } satisfies ViewStyle,
      switchTrackColors: {
        false: filter.switch.offBackground,
        true: filter.switch.onBackground,
      },
      switchThumbColor: filter.switch.thumb,
      switchProps: {
        trackColor: {
          false: filter.switch.offBackground,
          true: filter.switch.onBackground,
        },
        thumbColor: filter.switch.thumb,
        ios_backgroundColor: filter.switch.offBackground,
      },
    }),
    [background, cardHighlight, filter, text, themeColors],
  );
}
