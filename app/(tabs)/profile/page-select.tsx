import { SearchScreen } from "@/components/screens/search/SearchScreen";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

export default function PageSelectRoute() {
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();

  return (
    <View style={{ flex: 1 }}>
      <SearchScreen pageSelect={{ requestId: requestId ?? "" }} />
    </View>
  );
}
