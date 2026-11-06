import { PagePreview, type PagePreviewProps } from "@/components/previews/PagePreview";
import { CornerRemoveButton } from "@/components/screens/tripReport/CornerRemoveButton";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useResolvedIconSizeScale } from "@/utils/theme/resolvers";
import { FontAwesome5 } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { GestureDetector, type PanGesture } from "react-native-gesture-handler";

const DESIGN_REMOVE_BUTTON_SIZE = 24;
const DESIGN_REORDER_BUTTON_SIZE = 30;
/** How far the X button hangs past the card's top-right corner. */
const REMOVE_BUTTON_OFFSET = 12;
/** How far the reorder handle hangs past the card's left edge. */
const REORDER_BUTTON_OFFSET = 12;

export type SelectedPageCardProps = PagePreviewProps & {
  onRemove: () => void;
  /** Pan gesture for the reorder handle on the left edge; the handle is hidden without it. */
  reorderGesture?: PanGesture;
};

/**
 * {@link PagePreview} inside a dashed, rounded outline, for pages chosen in page select.
 * A circular X on the top-right corner removes the page; the left-edge handle drags it.
 */
export function SelectedPageCard({
  onRemove,
  reorderGesture,
  ...previewProps
}: SelectedPageCardProps) {
  const { background, text, preview } = useColorTheme();
  const iconSizeScale = useResolvedIconSizeScale();
  const reorderButtonSize = Math.round(DESIGN_REORDER_BUTTON_SIZE * iconSizeScale);

  return (
    <View style={[styles.outline, { borderColor: preview.page.selectionOutline }]}>
      <PagePreview {...previewProps} pressable={false} />
      {reorderGesture != null ? (
        <GestureDetector gesture={reorderGesture}>
          <View
            style={[
              styles.reorderButton,
              {
                width: reorderButtonSize,
                height: reorderButtonSize,
                borderRadius: reorderButtonSize / 2,
                marginTop: -reorderButtonSize / 2,
                backgroundColor: background,
                borderColor: text.primary,
              },
            ]}
            accessibilityRole="adjustable"
            accessibilityLabel={`Reorder ${previewProps.preview.title}`}
          >
            <FontAwesome5
              name="bars"
              size={Math.round(reorderButtonSize * 0.5)}
              color={text.primary}
            />
          </View>
        </GestureDetector>
      ) : null}
      <CornerRemoveButton
        onPress={onRemove}
        accessibilityLabel={`Remove ${previewProps.preview.title}`}
        designSize={DESIGN_REMOVE_BUTTON_SIZE}
        offset={REMOVE_BUTTON_OFFSET}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outline: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 4,
  },
  reorderButton: {
    position: "absolute",
    top: "50%",
    left: -REORDER_BUTTON_OFFSET,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    zIndex: 1,
  },
});
