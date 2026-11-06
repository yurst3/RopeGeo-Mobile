import { ConstantText } from "@/components/text/ConstantText";
import { ADD_BLOCK_BUTTON_KEY } from "@/constants/buttons";
import type { AddBlockButtonColors } from "@/constants/colors/types";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedIconSizeScale } from "@/utils/theme/resolvers";
import { Image } from "expo-image";
import { Pressable, StyleSheet, type ImageSourcePropType } from "react-native";

const DESIGN_ICON_SIZE = 48;
const DISABLED_OPACITY = 0.5;
const DESIGN_CORNER_ICON_SIZE = 18;
const CORNER_ICON_INSET = 6;

export type AddBlockButtonProps = {
  label: string;
  icon: ImageSourcePropType;
  onPress: () => void;
  /** When set, the button can't be pressed, fades, and shows this label in red instead. */
  disabledLabel?: string;
  /** Small untinted icon pinned to the top-right corner (e.g. a status marker). */
  cornerIcon?: ImageSourcePropType;
};

/**
 * Square dashed placeholder for adding a content block: an icon with its label below. Fills its
 * parent's width, so put it in a flex row to share the space with its siblings.
 */
export function AddBlockButton({
  label,
  icon,
  onPress,
  disabledLabel,
  cornerIcon,
}: AddBlockButtonProps) {
  const { button, text } = useColorTheme();
  const colors = button.nonstandard[ADD_BLOCK_BUTTON_KEY] as AddBlockButtonColors;
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const iconSizeScale = useResolvedIconSizeScale();
  const iconSize = Math.round(DESIGN_ICON_SIZE * iconSizeScale);
  const cornerIconSize = Math.round(DESIGN_CORNER_ICON_SIZE * iconSizeScale);
  const disabled = disabledLabel != null;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: colors.outline,
          opacity: disabled ? DISABLED_OPACITY : pressed ? 0.7 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={disabledLabel ?? label}
    >
      <Image
        source={icon}
        style={{ width: iconSize, height: iconSize }}
        contentFit="contain"
        tintColor={colors.icon}
        accessibilityElementsHidden
      />
      <ConstantText
        size={uiScale.filter.text.note}
        typography={textStyle.filter.optionLabel}
        style={[styles.label, { color: disabled ? text.error : colors.text }]}
      >
        {disabledLabel ?? label}
      </ConstantText>
      {cornerIcon != null ? (
        <Image
          source={cornerIcon}
          style={[styles.cornerIcon, { width: cornerIconSize, height: cornerIconSize }]}
          contentFit="contain"
          accessibilityElementsHidden
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 8,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  label: {
    textAlign: "center",
  },
  cornerIcon: {
    position: "absolute",
    top: CORNER_ICON_INSET,
    right: CORNER_ICON_INSET,
  },
});
