import { OptionChip } from "@/components/settings/OptionChip";
import { FONT_PROFILES } from "@/constants/text/font";
import type { FontProfileKey } from "@/constants/text/font/types";
import { SETTINGS_FONT_KEYS } from "@/constants/settings";
import { useTextStyle } from "@/context/TextContext";
import { resolveTypographyStyle } from "@/utils/resolvers";
import { StyleSheet, View } from "react-native";

const FONT_LABELS: Record<FontProfileKey, string> = {
  Auto: "Auto",
  Roboto: "Roboto",
  Merriweather: "Merriweather",
  ComicNeue: "Comic Neue",
  DancingScript: "Dancing Script",
};

export type FontSettingsSectionProps = {
  value: FontProfileKey;
  onChange: (font: FontProfileKey) => void;
};

export function FontSettingsSection({ value, onChange }: FontSettingsSectionProps) {
  const textStyle = useTextStyle();

  return (
    <View style={styles.rowWrap}>
      {SETTINGS_FONT_KEYS.map((key) => (
        <OptionChip
          key={key}
          label={FONT_LABELS[key]}
          selected={value === key}
          onPress={() => onChange(key)}
          labelTypography={textStyle.filter.optionLabel}
          labelStyle={resolveTypographyStyle(
            textStyle.filter.optionLabel,
            FONT_PROFILES[key],
          )}
        />
      ))}
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
