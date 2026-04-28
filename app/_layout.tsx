import { NetworkStateDebugToasts } from "@/components/debug/NetworkStateDebugToasts";
import { ToastStackAnchor } from "@/components/navigation/ToastStackAnchor";
import { NetworkStatusProvider, SHOW_NETWORK_STATE } from "@/context/NetworkStatusContext";
import { ToastProvider } from "@/context/ToastContext";
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
      <NetworkStatusProvider>
        <ToastProvider>
          <ToastStackAnchor />
          {SHOW_NETWORK_STATE ? <NetworkStateDebugToasts /> : null}
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
        </ToastProvider>
      </NetworkStatusProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
