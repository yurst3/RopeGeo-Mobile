import { OptionChip } from "@/components/settings/OptionChip";
import {
  SETTINGS_UI_SCALE_KEYS,
  UI_SCALE_OPTION_PREVIEW,
} from "@/constants/settings";
import type { UiScaleProfileKey } from "@/constants/uiScale/types";
import { useTextStyle } from "@/context/typography/TextContext";
import { StyleSheet, View } from "react-native";

const UI_SCALE_LABELS: Record<UiScaleProfileKey, string> = {
  Auto: "Auto",
  Small: "Small",
  Medium: "Medium",
  Large: "Large",
};

export type UiScaleSettingsSectionProps = {
  value: UiScaleProfileKey;
  onChange: (uiScale: UiScaleProfileKey) => void;
};

export function UiScaleSettingsSection({
  value,
  onChange,
}: UiScaleSettingsSectionProps) {
  const textStyle = useTextStyle();

  return (
    <View style={styles.rowWrap}>
      {SETTINGS_UI_SCALE_KEYS.map((key) => {
        const preview = UI_SCALE_OPTION_PREVIEW[key];
        return (
          <OptionChip
            key={key}
            label={UI_SCALE_LABELS[key]}
            selected={value === key}
            onPress={() => onChange(key)}
            labelTypography={textStyle.filter.optionLabel}
            labelSize={preview.labelSize}
            labelGlobal={preview.global}
          />
        );
      })}
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
