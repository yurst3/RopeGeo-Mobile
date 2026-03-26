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
      <Stack.Screen
        name="[id]/page"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
