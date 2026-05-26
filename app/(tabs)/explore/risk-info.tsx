import { RiskInfoScreen } from "@/components/screens/info/RiskInfoScreen";
import { AcaRiskSubRating } from "ropegeo-common/models";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

const VALID_RISKS: AcaRiskSubRating[] = Object.values(AcaRiskSubRating);

export default function RiskInfoRoute() {
  const params = useLocalSearchParams<{ highlightedRisk?: string }>();
  const raw = params.highlightedRisk;
  const highlightedRisk: AcaRiskSubRating | null =
    typeof raw === "string" && VALID_RISKS.includes(raw as AcaRiskSubRating)
      ? (raw as AcaRiskSubRating)
      : null;

  return (
    <View style={{ flex: 1 }}>
      <RiskInfoScreen highlightedRisk={highlightedRisk} />
    </View>
  );
}
