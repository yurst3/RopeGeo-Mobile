import { OptionChip } from "@/components/settings/OptionChip";
import { UnitsConversionPreview } from "@/components/screens/settings/UnitsConversionPreview";
import { UNITS_PREFERENCES, type UnitsPreference } from "@/constants/settings";
import { StyleSheet, View } from "react-native";

const UNITS_LABELS: Record<UnitsPreference, string> = {
  Imperial: "Imperial",
  Metric: "Metric",
  Freedom: "Freedom",
};

export type UnitsSettingsSectionProps = {
  value: UnitsPreference;
  onChange: (units: UnitsPreference) => void;
};

export function UnitsSettingsSection({ value, onChange }: UnitsSettingsSectionProps) {
  return (
    <View>
      <View style={styles.rowWrap}>
        {UNITS_PREFERENCES.map((key) => (
          <OptionChip
            key={key}
            label={UNITS_LABELS[key]}
            selected={value === key}
            onPress={() => onChange(key)}
          />
        ))}
      </View>
      <UnitsConversionPreview value={value} />
    </View>
  );
}

const styles = StyleSheet.create({
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
