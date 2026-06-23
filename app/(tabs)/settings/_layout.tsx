import { stackScreenOptions } from "@/lib/navigation/stackScreenOptions";
import { Stack } from "expo-router";

export default function SettingsStackLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
