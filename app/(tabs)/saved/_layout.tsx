import { Stack } from "expo-router";

export default function SavedStackLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="risk-info" options={{ headerShown: false }} />
      <Stack.Screen name="technical-info" options={{ headerShown: false }} />
      <Stack.Screen name="water-info" options={{ headerShown: false }} />
      <Stack.Screen name="time-info" options={{ headerShown: false }} />
      <Stack.Screen name="permit-info" options={{ headerShown: false }} />
      <Stack.Screen name="shuttle-info" options={{ headerShown: false }} />
      <Stack.Screen name="vehicle-info" options={{ headerShown: false }} />
      <Stack.Screen
        name="[id]/page"
        options={{
          headerShown: false,
          animation: "slide_from_right",
          animationTypeForReplace: "pop",
        }}
      />
    </Stack>
  );
}
