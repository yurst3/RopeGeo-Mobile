import { TechnicalInfoScreen } from "@/components/screens/info/TechnicalInfoScreen";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { AcaTechnicalSubRating } from "ropegeo-common/models";

const VALID_TECHNICAL: AcaTechnicalSubRating[] = Object.values(AcaTechnicalSubRating);

export default function TechnicalInfoRoute() {
  const params = useLocalSearchParams<{ highlightedTechnical?: string }>();
  const raw = params.highlightedTechnical;
  const highlightedTechnical: AcaTechnicalSubRating | null =
    typeof raw === "string" && VALID_TECHNICAL.includes(raw as AcaTechnicalSubRating)
      ? (raw as AcaTechnicalSubRating)
      : null;

  return (
    <View style={{ flex: 1 }}>
      <TechnicalInfoScreen highlightedTechnical={highlightedTechnical} />
    </View>
  );
}
