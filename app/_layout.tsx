import { AppToastProvider } from "@/components/toast";
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
      </AppToastProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
