import { SavedPagesProvider } from "@/context/SavedPagesContext";
import { DownloadQueueProvider } from "@/context/DownloadQueueContext";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SavedPagesProvider>
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
          <Toast />
        </DownloadQueueProvider>
      </SavedPagesProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
