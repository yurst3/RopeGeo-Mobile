import { stackScreenOptions } from "@/utils/navigation/stackScreenOptions";
import { Stack } from "expo-router";

export default function ExploreRegionLayout() {
  return (
    <Stack screenOptions={{ ...stackScreenOptions, headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
