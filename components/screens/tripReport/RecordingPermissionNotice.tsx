import { ConstantText } from "@/components/text/ConstantText";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import type { RecordingPermission } from "@/utils/location/recordingPermission";
import { Linking, Platform, Pressable, StyleSheet, View } from "react-native";

const SETTINGS_DIRECTIONS =
  Platform.OS === "ios"
    ? "To change this, go to Settings > RopeGeo > Location and choose Always."
    : "To change this, go to Settings > Apps > RopeGeo > Permissions > Location and choose Allow all the time.";

const MESSAGES: Partial<Record<RecordingPermission, string>> = {
  foregroundOnly: "Recording only works while RopeGeo is on screen.",
  denied: "Recording isn't available because RopeGeo doesn't have location access.",
};

/**
 * Red explanation shown above a trip report map when location access limits recording, with
 * directions and a link to the app's system settings. Renders nothing with full access.
 */
export function RecordingPermissionNotice({ permission }: { permission: RecordingPermission }) {
  const { text } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const message = MESSAGES[permission];
  if (message == null) return null;

  return (
    <View style={styles.container}>
      <ConstantText
        size={uiScale.filter.text.note}
        typography={textStyle.filter.optionLabel}
        style={{ color: text.error }}
      >
        {`${message} ${SETTINGS_DIRECTIONS}`}
      </ConstantText>
      <Pressable
        onPress={() => void Linking.openSettings()}
        accessibilityRole="link"
        hitSlop={8}
        style={({ pressed }) => [styles.link, { opacity: pressed ? 0.6 : 1 }]}
      >
        <ConstantText
          size={uiScale.filter.text.note}
          typography={textStyle.filter.optionLabel}
          style={{ color: text.link }}
        >
          Open Settings
        </ConstantText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
    marginBottom: 8,
  },
  link: {
    alignSelf: "flex-start",
  },
});
