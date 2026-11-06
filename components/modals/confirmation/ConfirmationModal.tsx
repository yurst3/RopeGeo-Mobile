import { ConstantText } from "@/components/text/ConstantText";
import { CONFIRM_REMOVE_BUTTON_KEY } from "@/constants/buttons";
import type { ConfirmRemoveButtonColors } from "@/constants/colors/types";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { SHARE_SHEET_BACKDROP_COLOR } from "@/context/ui/ShareSheetDimmerContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { Modal, Pressable, StyleSheet, View } from "react-native";

const WINDOW_HORIZONTAL_MARGIN = 32;

export type ConfirmationModalProps = {
  visible: boolean;
  title: string;
  message: string;
  /** Label of the destructive confirm button. */
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  /** Also called when the darkened background is tapped. */
  onCancel: () => void;
};

/** Centered window asking the user to confirm a destructive action. */
export function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const { background, text, button } = useColorTheme();
  const confirmColors = button.nonstandard[
    CONFIRM_REMOVE_BUTTON_KEY
  ] as ConfirmRemoveButtonColors;
  const uiScale = useUiScale();
  const textStyle = useTextStyle();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
        />
        <View
          style={[styles.window, { backgroundColor: background, shadowColor: button.shadowColor }]}
        >
          <ConstantText
            size={uiScale.filter.text.title}
            typography={textStyle.filter.title}
            style={[styles.centered, { color: text.primary }]}
          >
            {title}
          </ConstantText>
          <ConstantText
            size={uiScale.filter.text.sectionTitle}
            typography={textStyle.filter.optionLabel}
            style={[styles.centered, styles.message, { color: text.secondary }]}
          >
            {message}
          </ConstantText>
          <View style={styles.buttons}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [styles.button, { opacity: pressed ? 0.6 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <ConstantText
                size={uiScale.filter.text.sectionTitle}
                typography={textStyle.filter.sectionTitle}
                style={{ color: text.secondary }}
              >
                {cancelLabel}
              </ConstantText>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                { backgroundColor: confirmColors.background, opacity: pressed ? 0.7 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <ConstantText
                size={uiScale.filter.text.sectionTitle}
                typography={textStyle.filter.sectionTitle}
                style={{ color: confirmColors.text }}
              >
                {confirmLabel}
              </ConstantText>
            </Pressable>
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
    borderRadius: 16,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 12,
    alignItems: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  centered: {
    textAlign: "center",
  },
  message: {
    marginTop: 8,
  },
  buttons: {
    flexDirection: "row",
    gap: 24,
    marginTop: 16,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  confirmButton: {
    borderRadius: 8,
  },
});
