import { SavedTabBarIcon } from "@/components/navigation/SavedTabBarIcon";
import { SavedTabHighlightProvider } from "@/context/SavedTabHighlightContext";
import { ShareSheetDimmerOverlay } from "@/context/ShareSheetDimmerContext";
import { Tabs, router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

const EXPLORE_TAB_HREF = "/(tabs)/explore" as const;

export default function TabsLayout() {
  return (
    <SavedTabHighlightProvider>
      <View style={styles.tabsHost}>
        <Tabs>
          <Tabs.Screen
            name="explore"
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                const state = navigation.getState();
                const currentTab = state.routes[state.index];
                if (currentTab?.name === "explore") {
                  e.preventDefault();
                  router.replace(EXPLORE_TAB_HREF);
                }
              },
            })}
            options={{
              title: "explore",
              headerShown: false,
              tabBarIcon: ({ color, size, focused }) => (
                <FontAwesome name={focused ? "map" : "map-o"} size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="saved"
            options={{
              title: "saved",
              headerShown: false,
              tabBarIcon: ({ color, size, focused }) => (
                <SavedTabBarIcon color={color} size={size} focused={focused} />
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
