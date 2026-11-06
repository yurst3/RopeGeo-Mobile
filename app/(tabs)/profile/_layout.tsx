import { stackScreenOptions } from "@/utils/navigation/stackScreenOptions";
import { Stack } from "expo-router";

export default function ProfileStackLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="account"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="trip-report"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="page-select"
        options={{
          headerShown: false,
          animation: "fade",
        }}
      />
      <Stack.Screen name="relevance-info" options={{ headerShown: false }} />
    </Stack>
  );
}
