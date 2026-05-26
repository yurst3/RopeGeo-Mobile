import { WaterInfoScreen } from "@/components/screens/info/WaterInfoScreen";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { AcaWaterSubRating } from "ropegeo-common/models";

const VALID_WATER: AcaWaterSubRating[] = Object.values(AcaWaterSubRating);

export default function WaterInfoRoute() {
  const params = useLocalSearchParams<{ highlightedWater?: string }>();
  const raw = params.highlightedWater;
  const highlightedWater: AcaWaterSubRating | null =
    typeof raw === "string" && VALID_WATER.includes(raw as AcaWaterSubRating)
      ? (raw as AcaWaterSubRating)
      : null;

  return (
    <View style={{ flex: 1 }}>
      <WaterInfoScreen highlightedWater={highlightedWater} />
    </View>
  );
}
