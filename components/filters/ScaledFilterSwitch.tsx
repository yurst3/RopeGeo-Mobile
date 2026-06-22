import { useFilterSwitchScale } from "@/components/filters/useFilterSwitchScale";
import { Switch, View, type SwitchProps } from "react-native";

/** Native switch scaled via {@link useFilterSwitchScale}. */
export function ScaledFilterSwitch(props: SwitchProps) {
  const scale = useFilterSwitchScale();
  return (
    <View style={{ transform: [{ scale }] }}>
      <Switch {...props} />
    </View>
  );
}
