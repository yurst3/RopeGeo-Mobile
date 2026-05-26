import { TimeInfoScreen } from "@/components/screens/info/TimeInfoScreen";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { AcaTimeSubRating } from "ropegeo-common/models";

const VALID_TIME: AcaTimeSubRating[] = Object.values(AcaTimeSubRating);

export default function TimeInfoRoute() {
  const params = useLocalSearchParams<{ highlightedTime?: string }>();
  const raw = params.highlightedTime;
  const highlightedTime: AcaTimeSubRating | null =
    typeof raw === "string" && VALID_TIME.includes(raw as AcaTimeSubRating)
      ? (raw as AcaTimeSubRating)
      : null;

  return (
    <View style={{ flex: 1 }}>
      <TimeInfoScreen highlightedTime={highlightedTime} />
    </View>
  );
}
