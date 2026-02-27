import { Stack } from "expo-router";

export default function ExploreLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="risk-info"
        options={{
          title: "Risk ratings",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}
