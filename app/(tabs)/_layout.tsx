import { ExploreTabBarIcon } from "@/components/navigation/ExploreTabBarIcon";
import { SavedTabBarIcon } from "@/components/navigation/SavedTabBarIcon";
import { SettingsTabBarIcon } from "@/components/navigation/SettingsTabBarIcon";
import { useTabFocusToastScreenListeners } from "@/components/navigation/useTabFocusToastScreenListeners";
import { SavedTabHighlightProvider } from "@/context/SavedTabHighlightContext";
import { ShareSheetDimmerOverlay } from "@/context/ShareSheetDimmerContext";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useTextStyle } from "@/context/TextContext";
import { useUiScale } from "@/context/UIScaleContext";
import {
  useResolvedButtonConstantTextSize,
  useResolvedButtonIconScale,
  useResolvedTypography,
} from "@/utils/resolvers";
import { Tabs, router } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

const EXPLORE_TAB_HREF = "/(tabs)/explore" as const;
const TAB_BAR_ICON_BASE_SIZE = 26;

export default function TabsLayout() {
  const { tabBar } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const tabLabelFontSize =
    useResolvedButtonConstantTextSize(uiScale.tabs.buttons.tabBar) ?? 10;
  const tabIconSize = Math.round(
    TAB_BAR_ICON_BASE_SIZE * useResolvedButtonIconScale(uiScale.tabs.buttons.tabBar),
  );
  const tabLabelTypography = useResolvedTypography(textStyle.button.tabLabel);
  const tabFocusToastListeners = useTabFocusToastScreenListeners();

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarActiveTintColor: tabBar.iconFocused,
      tabBarInactiveTintColor: tabBar.iconUnfocused,
      tabBarStyle: {
        backgroundColor: tabBar.background,
        borderTopColor: tabBar.background,
      },
      tabBarLabelStyle: {
        ...tabLabelTypography,
        fontSize: tabLabelFontSize,
      },
    }),
    [tabBar, tabLabelFontSize, tabLabelTypography, tabIconSize],
  );

  return (
    <SavedTabHighlightProvider>
      <View style={styles.tabsHost}>
        <Tabs screenOptions={screenOptions} screenListeners={tabFocusToastListeners}>
          <Tabs.Screen
            name="explore"
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                const state = navigation.getState();
                const currentTab = state.routes[state.index];
                if (currentTab?.name === "explore") {
                  e.preventDefault();
                  if (router.canDismiss()) {
                    router.dismissTo(EXPLORE_TAB_HREF);
                  }
                }
              },
            })}
            options={{
              title: "explore",
              tabBarIcon: ({ focused }) => (
                <ExploreTabBarIcon size={tabIconSize} focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="saved"
            options={{
              title: "saved",
              tabBarIcon: ({ focused }) => (
                <SavedTabBarIcon size={tabIconSize} focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: "settings",
              tabBarIcon: ({ focused }) => (
                <SettingsTabBarIcon size={tabIconSize} focused={focused} />
              ),
            }}
          />
        </Tabs>
        <ShareSheetDimmerOverlay />
      </View>
    </SavedTabHighlightProvider>
  );
}

const styles = StyleSheet.create({
  tabsHost: { flex: 1 },
});
