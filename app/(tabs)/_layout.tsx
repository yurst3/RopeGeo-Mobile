import { SavedTabBarIcon } from "@/components/navigation/SavedTabBarIcon";
import { SavedTabHighlightProvider } from "@/context/SavedTabHighlightContext";
import { ShareSheetDimmerOverlay } from "@/context/ShareSheetDimmerContext";
import { useColorTheme } from "@/context/ColorThemeContext";
import { Tabs, router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

const EXPLORE_TAB_HREF = "/(tabs)/explore" as const;

export default function TabsLayout() {
  const { tabBar } = useColorTheme();

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarActiveTintColor: tabBar.iconFocused,
      tabBarInactiveTintColor: tabBar.iconUnfocused,
      tabBarStyle: {
        backgroundColor: tabBar.background,
        borderTopColor: tabBar.background,
      },
    }),
    [tabBar],
  );

  return (
    <SavedTabHighlightProvider>
      <View style={styles.tabsHost}>
        <Tabs screenOptions={screenOptions}>
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
              tabBarIcon: ({ size, focused }) => (
                <FontAwesome
                  name={focused ? "map" : "map-o"}
                  size={size}
                  color={focused ? tabBar.iconFocused : tabBar.iconUnfocused}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="saved"
            options={{
              title: "saved",
              tabBarIcon: ({ size, focused }) => (
                <SavedTabBarIcon size={size} focused={focused} />
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
