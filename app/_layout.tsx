import { NetworkStateDebugToasts } from "@/components/toast/NetworkStateDebugToasts";
import { ToastStackAnchor } from "@/components/navigation/ToastStackAnchor";
import { ColorThemeProvider } from "@/context/ColorThemeContext";
import { TextProvider } from "@/context/TextContext";
import { NetworkStatusProvider, SHOW_NETWORK_STATE } from "@/context/NetworkStatusContext";
import { ToastProvider } from "@/context/ToastContext";
import { ShareSheetDimmerProvider } from "@/context/ShareSheetDimmerContext";
import { SavedPagesProvider } from "@/context/SavedPagesContext";
import { SavedFiltersProvider } from "@/context/SavedFiltersContext";
import { DownloadJobQueueProvider } from "@/context/DownloadJobQueueContext";
import { stackScreenOptions } from "@/lib/navigation/stackScreenOptions";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ColorThemeProvider>
        <TextProvider>
          <NetworkStatusProvider>
            <ToastProvider>
              <ToastStackAnchor />
              {SHOW_NETWORK_STATE ? <NetworkStateDebugToasts /> : null}
              <ShareSheetDimmerProvider>
                <SavedPagesProvider>
                  <SavedFiltersProvider>
                    <DownloadJobQueueProvider>
                      <Stack screenOptions={stackScreenOptions}>
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
                    </DownloadJobQueueProvider>
                  </SavedFiltersProvider>
                </SavedPagesProvider>
              </ShareSheetDimmerProvider>
            </ToastProvider>
          </NetworkStatusProvider>
        </TextProvider>
      </ColorThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
