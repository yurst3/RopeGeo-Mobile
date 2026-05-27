import { stackScreenOptions } from "@/lib/navigation/stackScreenOptions";
import { Stack } from "expo-router";

export default function ExplorePageLayout() {
  return (
    <Stack screenOptions={{ ...stackScreenOptions, headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
