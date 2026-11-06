import { ScalingText } from "@/components/text/ScalingText";
import { useSavedPages } from "@/context/data/SavedPagesContext";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useHeaderChromeLayout } from "@/utils/layout/buttonChromeLayout";
import { useResolvedIconSizeScale } from "@/utils/theme/resolvers";
import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import type { SavedPage } from "ropegeo-common/models";

const GHOST_ICON = require("@/assets/images/icons/buttons/ghost.png");
const DOWNLOAD_ICON = require("@/assets/images/icons/buttons/download.png");
const DESIGN_GHOST_ICON_SIZE = 20;
const DESIGN_DOWNLOAD_ICON_SIZE = 16;
const DESIGN_CHEVRON_SIZE = 14;
const DESIGN_CLEAR_ICON_SIZE = 16;
/** Share of the window height the open list may take before it scrolls. */
const LIST_MAX_HEIGHT_RATIO = 0.4;
const LIST_GAP = 6;

export type TripReportGhostDropdownProps = {
  /** The saved page shown as the ghost route, or null for none. */
  selectedPage: SavedPage | null;
  onSelectPage: (pageId: string | null) => void;
  /** When false, the dropdown looks inert and ignores presses (e.g. mid expand animation). */
  interactive?: boolean;
};

/**
 * Picker for a trip report map's ghost route: one saved page whose route is drawn faintly behind
 * the trip report's own features. Sits where other expanded minimaps show their title. Lists every
 * saved page, marking downloaded ones; pages without a route map can't be picked.
 */
export function TripReportGhostDropdown({
  selectedPage,
  onSelectPage,
  interactive = true,
}: TripReportGhostDropdownProps) {
  const themeColors = useColorTheme();
  const { text, separator, cardHighlight } = themeColors;
  const { title: titleColors, legend: legendColors } = themeColors.map.minimap;
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const headerChrome = useHeaderChromeLayout();
  const iconScale = useResolvedIconSizeScale();
  const { height: windowHeight } = useWindowDimensions();
  const { savedEntries } = useSavedPages();
  const [open, setOpen] = useState(false);

  const pages = useMemo(
    () => [...savedEntries].sort((a, b) => a.preview.title.localeCompare(b.preview.title)),
    [savedEntries],
  );

  const ghostIconSize = Math.round(DESIGN_GHOST_ICON_SIZE * iconScale);
  const downloadIconSize = Math.round(DESIGN_DOWNLOAD_ICON_SIZE * iconScale);
  const chevronSize = Math.round(DESIGN_CHEVRON_SIZE * iconScale);
  const clearIconSize = Math.round(DESIGN_CLEAR_ICON_SIZE * iconScale);

  const cardStyle = {
    backgroundColor: titleColors.background,
    shadowColor: titleColors.shadow,
  };

  const selectPage = (pageId: string | null) => {
    setOpen(false);
    onSelectPage(pageId);
  };

  return (
    <View
      style={[styles.container, !interactive ? styles.dimmed : null]}
      pointerEvents={interactive ? "box-none" : "none"}
    >
      <Pressable
        onPress={() => setOpen(!open)}
        style={({ pressed }) => [
          styles.card,
          styles.pill,
          cardStyle,
          {
            minHeight: headerChrome.buttonWrapHeight,
            paddingVertical: headerChrome.titleBarPaddingVertical,
            paddingHorizontal: headerChrome.titleBarPaddingHorizontal,
          },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          selectedPage != null ? `Ghost route: ${selectedPage.preview.title}` : "Select a ghost route"
        }
        accessibilityState={{ expanded: open }}
      >
        <Image
          source={GHOST_ICON}
          style={{ width: ghostIconSize, height: ghostIconSize, tintColor: text.primary }}
          contentFit="contain"
          accessibilityElementsHidden
        />
        <ScalingText
          size={uiScale.map.text.title}
          typography={textStyle.map.title}
          numberOfLines={1}
          measure={{ type: "width" }}
          containerStyle={styles.titleWrap}
          style={{ color: selectedPage != null ? text.primary : text.secondary }}
        >
          {selectedPage != null ? selectedPage.preview.title : "Select a ghost route"}
        </ScalingText>
        {selectedPage != null ? (
          <Pressable
            onPress={() => selectPage(null)}
            hitSlop={10}
            style={({ pressed }) => [styles.trailingSlot, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Remove ghost route"
          >
            <FontAwesome5 name="times" size={clearIconSize} color={legendColors.collapseIcon} />
          </Pressable>
        ) : (
          <View
            style={styles.trailingSlot}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <FontAwesome5
              name={open ? "chevron-up" : "chevron-down"}
              size={chevronSize}
              color={legendColors.collapseIcon}
            />
          </View>
        )}
      </Pressable>
      {open ? (
        <View style={[styles.card, styles.list, cardStyle]}>
          <ScrollView
            style={{ maxHeight: windowHeight * LIST_MAX_HEIGHT_RATIO }}
            showsVerticalScrollIndicator
          >
            {pages.length === 0 ? (
              <View style={styles.row}>
                <ScalingText
                  size={uiScale.map.text.legendItem}
                  typography={textStyle.map.legendItem}
                  numberOfLines={2}
                  measure={{ type: "lineCount", maxLinesAtMaxSize: 2 }}
                  containerStyle={styles.rowLabelWrap}
                  style={{ color: text.tertiary }}
                >
                  No saved pages
                </ScalingText>
              </View>
            ) : (
              pages.map((page, index) => {
                const hasRoute = page.preview.mapData != null;
                const selected = page.preview.id === selectedPage?.preview.id;
                const downloaded = page.downloadedPageViewPath != null;
                return (
                  <Pressable
                    key={page.preview.id}
                    onPress={() => selectPage(page.preview.id)}
                    disabled={!hasRoute}
                    style={({ pressed }) => [
                      styles.row,
                      index > 0 && {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: separator,
                      },
                      selected && { backgroundColor: cardHighlight },
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={page.preview.title}
                    accessibilityState={{ selected, disabled: !hasRoute }}
                  >
                    <ScalingText
                      size={uiScale.map.text.legendItem}
                      typography={textStyle.map.legendItem}
                      numberOfLines={2}
                      measure={{ type: "lineCount", maxLinesAtMaxSize: 2 }}
                      containerStyle={styles.rowLabelWrap}
                      style={[
                        { color: hasRoute ? text.primary : text.tertiary },
                        selected && { fontWeight: "600" as const },
                      ]}
                    >
                      {page.preview.title}
                    </ScalingText>
                    {downloaded ? (
                      <Image
                        source={DOWNLOAD_ICON}
                        style={{
                          width: downloadIconSize,
                          height: downloadIconSize,
                          tintColor: hasRoute ? text.secondary : text.tertiary,
                        }}
                        contentFit="contain"
                        accessibilityLabel="Downloaded"
                      />
                    ) : null}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 4,
    gap: LIST_GAP,
  },
  dimmed: {
    opacity: 0.45,
  },
  card: {
    borderRadius: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  trailingSlot: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowLabelWrap: {
    flex: 1,
    minWidth: 0,
  },
});
