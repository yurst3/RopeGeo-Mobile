import { AppToastProvider } from "@/components/toast";
import { ShareSheetDimmerProvider } from "@/context/ShareSheetDimmerContext";
import { SavedPagesProvider } from "@/context/SavedPagesContext";
import { SavedFiltersProvider } from "@/context/SavedFiltersContext";
import { DownloadQueueProvider } from "@/context/DownloadQueueContext";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AppToastProvider>
        <ShareSheetDimmerProvider>
          <SavedPagesProvider>
            <SavedFiltersProvider>
              <DownloadQueueProvider>
                <Stack>
                  <Stack.Screen
                    name="(tabs)"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="index"
                    options={{
                      headerShown: false,
                    }}
                  />
                </Stack>
              </DownloadQueueProvider>
            </SavedFiltersProvider>
          </SavedPagesProvider>
        </ShareSheetDimmerProvider>
      </AppToastProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
