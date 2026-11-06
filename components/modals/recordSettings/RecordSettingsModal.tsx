import { WaypointDeadzoneSetting } from "@/components/modals/recordSettings/WaypointDeadzoneSetting";
import { WaypointIntervalSetting } from "@/components/modals/recordSettings/WaypointIntervalSetting";
import { WaypointMaxAccuracySetting } from "@/components/modals/recordSettings/WaypointMaxAccuracySetting";
import { ConstantText } from "@/components/text/ConstantText";
import { SHARE_SHEET_BACKDROP_COLOR } from "@/context/ui/ShareSheetDimmerContext";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedIconSizeScale } from "@/utils/theme/resolvers";
import { FontAwesome5 } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, View } from "react-native";

const WINDOW_HORIZONTAL_MARGIN = 24;
const WINDOW_PADDING = 16;
const WINDOW_BORDER_RADIUS = 16;
const DESIGN_CLOSE_ICON_SIZE = 18;

export type RecordSettingsModalProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Centered window for the global line segment recording settings. Tapping the darkened
 * background or the X closes it.
 */
export function RecordSettingsModal({ visible, onClose }: RecordSettingsModalProps) {
  const { background, text, button } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const closeIconSize = Math.round(DESIGN_CLOSE_ICON_SIZE * useResolvedIconSizeScale());

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close record settings"
        />
        <View
          style={[
            styles.window,
            { backgroundColor: background, shadowColor: button.shadowColor },
          ]}
        >
          <View style={styles.header}>
            <ConstantText
              size={uiScale.filter.text.title}
              typography={textStyle.filter.title}
              style={[styles.title, { color: text.primary }]}
            >
              Line Segment Record Settings
            </ConstantText>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <FontAwesome5 name="times" size={closeIconSize} color={text.primary} />
            </Pressable>
          </View>
          <View style={styles.settings}>
            <WaypointIntervalSetting />
            <WaypointDeadzoneSetting />
            <WaypointMaxAccuracySetting />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: WINDOW_HORIZONTAL_MARGIN,
    backgroundColor: SHARE_SHEET_BACKDROP_COLOR,
  },
  window: {
    borderRadius: WINDOW_BORDER_RADIUS,
    padding: WINDOW_PADDING,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  title: {
    flex: 1,
  },
  settings: {
    marginTop: 16,
    gap: 16,
  },
});
