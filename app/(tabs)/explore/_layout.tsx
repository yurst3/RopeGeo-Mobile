import { BackButton } from "@/components/buttons/BackButton";
import { Stack, useRouter } from "expo-router";

function HeaderBackButton() {
  const router = useRouter();
  return <BackButton onPress={() => router.back()} />;
}

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
          title: "Effective Risk",
          headerBackVisible: false,
          headerLeft: () => <HeaderBackButton />,
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 20,
          },
        }}
      />
      <Stack.Screen
        name="technical-info"
        options={{
          title: "Technical ratings",
          headerBackVisible: false,
          headerLeft: () => <HeaderBackButton />,
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 20,
          },
        }}
      />
      <Stack.Screen
        name="water-info"
        options={{
          title: "Water ratings",
          headerBackVisible: false,
          headerLeft: () => <HeaderBackButton />,
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 20,
          },
        }}
      />
      <Stack.Screen
        name="time-info"
        options={{
          title: "Time ratings",
          headerBackVisible: false,
          headerLeft: () => <HeaderBackButton />,
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 20,
          },
        }}
      />
      <Stack.Screen
        name="permit-info"
        options={{
          title: "Permit status",
          headerBackVisible: false,
          headerLeft: () => <HeaderBackButton />,
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 20,
          },
        }}
      />
      <Stack.Screen
        name="shuttle-info"
        options={{
          title: "Shuttle",
          headerBackVisible: false,
          headerLeft: () => <HeaderBackButton />,
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 20,
          },
        }}
      />
      <Stack.Screen
        name="vehicle-info"
        options={{
          title: "Vehicle type",
          headerBackVisible: false,
          headerLeft: () => <HeaderBackButton />,
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 20,
          },
        }}
      />
      <Stack.Screen
        name="[id]/page"
        options={{
          headerShown: false,
          animation: "slide_from_right",
          animationTypeForReplace: "pop"
        }}
      />
      <Stack.Screen
        name="[id]/region"
        options={{
          headerShown: false,
          animation: "slide_from_right",
          animationTypeForReplace: "pop"
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          headerShown: false,
          animation: "fade",
        }}
      />
    </Stack>
  );
}
