import { OptionChip } from "@/components/settings/OptionChip";
import { ColorSwatch } from "@/components/settings/ColorSwatch";
import { COLORS } from "@/constants/colors";
import { THEME_PREFERENCES, type ThemePreference } from "@/constants/settings";
import { useColorScheme } from "react-native";
import { StyleSheet, View } from "react-native";

const THEME_LABELS: Record<ThemePreference, string> = {
  Auto: "Auto",
  Light: "Light",
  Dark: "Dark",
  Fabulous: "Fabulous",
};

function swatchColors(preference: ThemePreference, systemDark: boolean) {
  if (preference === "Light") {
    return {
      primary: COLORS.Light.background,
      secondary: COLORS.Light.text.link,
    };
  }
  if (preference === "Dark") {
    return {
      primary: COLORS.Dark.background,
      secondary: COLORS.Dark.text.link,
    };
  }
  if (preference === "Fabulous") {
    return {
      primary: COLORS.Fabulous.background,
      secondary: COLORS.Fabulous.text.link,
    };
  }
  const theme = systemDark ? COLORS.Dark : COLORS.Light;
  return { primary: theme.background, secondary: theme.text.link };
}

export type ThemeSettingsSectionProps = {
  value: ThemePreference;
  onChange: (theme: ThemePreference) => void;
};

export function ThemeSettingsSection({ value, onChange }: ThemeSettingsSectionProps) {
  const systemScheme = useColorScheme();
  const systemDark = systemScheme === "dark";

  return (
    <View style={styles.rowWrap}>
      {THEME_PREFERENCES.map((preference) => {
        const colors = swatchColors(preference, systemDark);
        return (
          <OptionChip
            key={preference}
            label={THEME_LABELS[preference]}
            selected={value === preference}
            onPress={() => onChange(preference)}
            leading={
              <ColorSwatch
                primaryColor={colors.primary}
                secondaryColor={colors.secondary}
              />
            }
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
