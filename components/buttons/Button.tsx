import type { ReactNode } from "react";
import type { ImageSourcePropType } from "react-native";
import { Image } from "expo-image";
import {
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { STANDARD_BUTTON_SHADOW } from "@/utils/theme/standardButtonShadow";

export const STANDARD_BUTTON_SIZE = 44;

const ICON_SIZE_RATIO = 0.5;

export type ButtonProps = {
  onPress: () => void;
  backgroundColor: string;
  shadowColor: string;
  /** When set, draws a 1px border (e.g. external link on dark backgrounds). */
  borderColor?: string;
  /** When omitted, `children` must be provided. */
  icon?: ImageSourcePropType;
  /** Applied as Image tint when set and `highlighted` is false. Omit for no tint. */
  iconColor?: string;
  /** Applied as Image tint when `highlighted` is true. Omit for no tint. */
  iconColorHighlight?: string;
  /**
   * Optional second silhouette stacked on `icon` (e.g. "+" / "X" from
   * `assets/images/icons/buttons/layered/.../accent.png`).
   */
  iconAccent?: ImageSourcePropType;
  /** Tint for {@link iconAccent} (e.g. green "+" / red "X"). */
  iconAccentColor?: string;
  highlighted?: boolean;
  /** Multiplier for icon dimensions relative to `size`. Default 1. */
  iconScale?: number;
  size?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Custom icon content (e.g. vector icons, rotated compass). */
  children?: ReactNode;
};

export function Button({
  onPress,
  backgroundColor,
  shadowColor,
  borderColor,
  icon,
  iconColor,
  iconColorHighlight,
  iconAccent,
  iconAccentColor,
  highlighted = false,
  iconScale = 1,
  size = STANDARD_BUTTON_SIZE,
  disabled = false,
  accessibilityLabel,
  style,
  children,
}: ButtonProps) {
  const iconSize = Math.round(size * ICON_SIZE_RATIO * iconScale);
  const tintColor =
    highlighted && iconColorHighlight != null
      ? iconColorHighlight
      : iconColor;

  let iconContent: ReactNode = null;
  if (children != null) {
    iconContent = children;
  } else if (icon != null && iconAccent != null) {
    iconContent = (
      <View style={{ width: iconSize, height: iconSize }}>
        <Image
          source={icon}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          tintColor={tintColor}
        />
        <Image
          source={iconAccent}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          tintColor={iconAccentColor}
        />
      </View>
    );
  } else if (icon != null) {
    iconContent = (
      <Image
        source={icon}
        style={{ width: iconSize, height: iconSize }}
        contentFit="contain"
        tintColor={tintColor}
      />
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          shadowColor,
          ...(borderColor != null
            ? { borderWidth: 2, borderColor }
            : undefined),
        },
        pressed && styles.buttonPressed,
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {iconContent}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
    ...STANDARD_BUTTON_SHADOW,
  },
  buttonPressed: {
    opacity: 0.6,
  },
});
