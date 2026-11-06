import { BETA_SECTION_COLLAPSED_TEXT_HEIGHT } from "@/components/betaSection/BetaSection";
import { useTapOutside } from "@/components/gestures/TapOutside";
import { CornerRemoveButton } from "@/components/screens/tripReport/CornerRemoveButton";
import { ConstantText } from "@/components/text/ConstantText";
import { CONFIRM_REMOVE_BUTTON_KEY } from "@/constants/buttons";
import type { ConfirmRemoveButtonColors } from "@/constants/colors/types";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import {
  useResolvedConstantSize,
  useResolvedScalingBounds,
  useResolvedTypography,
} from "@/utils/theme/resolvers";
import { useEffect, useState } from "react";
import { BackHandler, Pressable, StyleSheet, TextInput, View } from "react-native";

const BLOCK_PADDING = 12;
const DESIGN_REMOVE_BUTTON_SIZE = 24;
/** How far the X button hangs past the block's top-right corner. */
const REMOVE_BUTTON_OFFSET = 12;
/** Keeps header text from running under the X button. */
const HEADER_RIGHT_INSET = 16;
const DELETE_CONFIRMATION_OPACITY = 0.5;

export type TextBlockProps = {
  header: string;
  body: string;
  onChangeHeader: (header: string) => void;
  onChangeBody: (body: string) => void;
  onRemove: () => void;
};

/**
 * Editable trip report text block: a one-line header and a wrapping body, split by a dashed
 * line. The body starts at the height of a collapsed beta section's text and grows with it.
 * Removing a block that has text asks for confirmation first; any press outside the
 * confirmation cancels it, while scrolling keeps working. Needs a `TapOutsideRoot` ancestor.
 */
export function TextBlock({
  header,
  body,
  onChangeHeader,
  onChangeBody,
  onRemove,
}: TextBlockProps) {
  const { background, text, preview, button } = useColorTheme();
  const confirmRemoveColors = button.nonstandard[
    CONFIRM_REMOVE_BUTTON_KEY
  ] as ConfirmRemoveButtonColors;
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const { maxFontSize: headerFontSize } = useResolvedScalingBounds(
    uiScale.betaSection.text.title,
  );
  const headerTypography = useResolvedTypography(textStyle.betaSection.title);
  const bodyFontSize = useResolvedConstantSize(uiScale.betaSection.text.body);
  const bodyTypography = useResolvedTypography(textStyle.betaSection.body);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const outlineColor = deleteConfirmation ? text.error : preview.page.selectionOutline;
  const inputColor = deleteConfirmation ? text.error : text.primary;

  const cancelDelete = () => setDeleteConfirmation(false);
  const { insideProps } = useTapOutside(deleteConfirmation, cancelDelete);

  useEffect(() => {
    if (!deleteConfirmation) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      setDeleteConfirmation(false);
      return true;
    });
    return () => subscription.remove();
  }, [deleteConfirmation]);

  const onRemovePress = () => {
    if (deleteConfirmation) return;
    if (header.trim().length === 0 && body.trim().length === 0) {
      onRemove();
      return;
    }
    setDeleteConfirmation(true);
  };

  const confirmDelete = () => {
    setDeleteConfirmation(false);
    onRemove();
  };

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.block,
          { borderColor: outlineColor },
          deleteConfirmation && styles.faded,
        ]}
      >
        <TextInput
          value={header}
          onChangeText={onChangeHeader}
          placeholder="Header (optional)"
          placeholderTextColor={deleteConfirmation ? text.error : text.tertiary}
          editable={!deleteConfirmation}
          allowFontScaling={false}
          multiline={false}
          numberOfLines={1}
          style={[
            headerTypography,
            styles.input,
            styles.header,
            { fontSize: headerFontSize, color: inputColor },
          ]}
          accessibilityLabel="Text block header"
        />
        <View style={styles.dividerClip}>
          <View style={[styles.dividerDashes, { borderColor: outlineColor }]} />
        </View>
        <TextInput
          value={body}
          onChangeText={onChangeBody}
          placeholder="Body"
          placeholderTextColor={deleteConfirmation ? text.error : text.tertiary}
          editable={!deleteConfirmation}
          allowFontScaling={false}
          multiline
          scrollEnabled={false}
          textAlignVertical="top"
          style={[
            bodyTypography,
            styles.input,
            styles.body,
            { fontSize: bodyFontSize, color: inputColor },
          ]}
          accessibilityLabel="Text block body"
        />
        <CornerRemoveButton
          onPress={onRemovePress}
          accessibilityLabel="Remove text block"
          designSize={DESIGN_REMOVE_BUTTON_SIZE}
          offset={REMOVE_BUTTON_OFFSET}
        />
      </View>
      {deleteConfirmation ? (
        <View pointerEvents="box-none" style={styles.confirmationArea}>
          <View
            {...insideProps}
            style={[
              styles.confirmationCard,
              { backgroundColor: background, shadowColor: button.shadowColor },
            ]}
          >
            <ConstantText
              size={uiScale.filter.text.sectionTitle}
              typography={textStyle.filter.optionLabel}
              style={[styles.confirmationMessage, { color: text.primary }]}
            >
              Are you sure you want to remove?
            </ConstantText>
            <View style={styles.confirmationButtons}>
              <Pressable
                onPress={cancelDelete}
                style={styles.confirmationButton}
                accessibilityRole="button"
                accessibilityLabel="No, keep text block"
              >
                <ConstantText
                  size={uiScale.filter.text.sectionTitle}
                  typography={textStyle.filter.sectionTitle}
                  style={{ color: text.secondary }}
                >
                  No
                </ConstantText>
              </Pressable>
              <Pressable
                onPress={confirmDelete}
                style={({ pressed }) => [
                  styles.confirmationButton,
                  styles.confirmRemoveButton,
                  {
                    backgroundColor: confirmRemoveColors.background,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Yes, remove text block"
              >
                <ConstantText
                  size={uiScale.filter.text.sectionTitle}
                  typography={textStyle.filter.sectionTitle}
                  style={{ color: confirmRemoveColors.text }}
                >
                  Yes
                </ConstantText>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "stretch",
  },
  block: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: BLOCK_PADDING,
  },
  faded: {
    opacity: DELETE_CONFIRMATION_OPACITY,
  },
  input: {
    padding: 0,
    margin: 0,
  },
  header: {
    marginRight: HEADER_RIGHT_INSET,
  },
  // A 1px window onto the top edge of a dashed box: a dashed line that works on both platforms.
  dividerClip: {
    height: 1,
    overflow: "hidden",
    marginHorizontal: -BLOCK_PADDING,
    marginVertical: 10,
  },
  dividerDashes: {
    height: 2,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  body: {
    minHeight: BETA_SECTION_COLLAPSED_TEXT_HEIGHT,
  },
  confirmationArea: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmationCard: {
    borderRadius: 14,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmationMessage: {
    textAlign: "center",
  },
  confirmationButtons: {
    flexDirection: "row",
    gap: 24,
    marginTop: 8,
  },
  confirmationButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  confirmRemoveButton: {
    borderRadius: 8,
  },
});
