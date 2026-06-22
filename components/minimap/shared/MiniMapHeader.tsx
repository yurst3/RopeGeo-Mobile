import type { ReactNode } from "react";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { BackButton } from "@/components/buttons/standard/BackButton";
import { ScalingText } from "@/components/text/ScalingText";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useText } from "@/context/TextContext";
import { useHeaderChromeLayout } from "@/utils/buttonChromeLayout";

/** Wraps one control in the expanded minimap header row (mirrors the back-button slot). */
export function MiniMapHeaderSideSlot({ children }: { children: ReactNode }) {
  const headerChrome = useHeaderChromeLayout();
  return (
    <View
      style={[
        styles.headerButtonWrap,
        styles.headerSideSlot,
        {
          width: headerChrome.sideSlotWidth,
          height: headerChrome.buttonWrapHeight,
        },
      ]}
    >
      {children}
    </View>
  );
}

/** Groups multiple header-side controls (e.g. fit-bounds + filter). */
export function MiniMapHeaderSideSlots({ children }: { children: ReactNode }) {
  const headerChrome = useHeaderChromeLayout();
  return (
    <View style={[styles.headerSideSlotsRow, { gap: headerChrome.gap }]}>
      {children}
    </View>
  );
}

export function MiniMapHeader({
  title,
  onBack,
  rightSlot,
  top,
}: {
  title: string;
  onBack: () => void;
  rightSlot?: ReactNode;
  top: number;
}) {
  const themeColors = useColorTheme();
  const { uiScale, style: textStyle } = useText();
  const headerChrome = useHeaderChromeLayout();
  const { minimap } = themeColors.map;
  const { text } = themeColors;

  const titleBarStyle = useMemo(
    () => [
      styles.titleBar,
      {
        backgroundColor: minimap.title.background,
        shadowColor: minimap.title.shadow,
      },
    ],
    [minimap.title.background, minimap.title.shadow],
  );

  const titleTextStyle = useMemo(
    () => [{ color: text.primary, textAlign: "center" as const }],
    [text.primary],
  );

  return (
    <View style={[styles.headerRow, { top }]} pointerEvents="box-none">
      <View
        style={[
          styles.headerButtonWrap,
          {
            width: headerChrome.sideSlotWidth,
            height: headerChrome.buttonWrapHeight,
          },
        ]}
      >
        <BackButton onPress={onBack} />
      </View>
      <View style={titleBarStyle}>
        <ScalingText
          size={uiScale.map.text.title}
          typography={textStyle.map.title}
          numberOfLines={1}
          measure={{ type: "width" }}
          style={titleTextStyle}
        >
          {title}
        </ScalingText>
      </View>
      {rightSlot ?? (
        <View style={{ width: headerChrome.sideSlotWidth }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 3900,
    flexDirection: "row",
    alignItems: "center",
  },
  headerButtonWrap: {
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerSideSlot: {
    alignItems: "flex-end",
  },
  headerSideSlotsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleBar: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 4,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});
