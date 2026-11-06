import { ConstantText } from "@/components/text/ConstantText";
import type { TypographySpec } from "@/constants/text/style/types";
import type { ConstantTextSizeSpec } from "@/constants/uiScale/types";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import {
  useResolvedConstantSize,
  useResolvedIconSizeScale,
  useResolvedTypography,
} from "@/utils/theme/resolvers";
import { Image } from "expo-image";
import { measureWidth } from "react-native-text-metrics";
import {
  StyleSheet,
  TextInput as RNTextInput,
  View,
  type TextStyle as RNTextStyle,
} from "react-native";

const EDIT_ICON = require("@/assets/images/icons/buttons/edit.png");
const DESIGN_EDIT_ICON_SIZE = 24;
const EDIT_ICON_GAP = 4;
const HORIZONTAL_PADDING = 12;
const TITLE_HORIZONTAL_PADDING = 4;

function measureTextWidth(
  text: string,
  fontSize: number,
  typographyStyle: RNTextStyle,
): number {
  const fontWeight = typographyStyle.fontWeight;
  return Math.ceil(
    measureWidth(text.length > 0 ? text : " ", {
      fontSize,
      fontFamily:
        typeof typographyStyle.fontFamily === "string"
          ? typographyStyle.fontFamily
          : undefined,
      fontWeight: fontWeight == null ? undefined : String(fontWeight),
      letterSpacing:
        typeof typographyStyle.letterSpacing === "number"
          ? typographyStyle.letterSpacing
          : undefined,
      allowFontScaling: false,
    }),
  );
}

export type TextInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  placeholder: string;
  size: ConstantTextSizeSpec;
  /** Font size used when the field is empty (placeholder). Defaults to `size`. */
  hintSize?: ConstantTextSizeSpec;
  typography: TypographySpec;
  accessibilityLabel?: string;
  /** Horizontal text alignment. Defaults to center. */
  align?: "center" | "left";
  /** Minimum field width. Defaults to the measured content width. */
  minWidth?: number;
  /** Maximum field width. Past this width the text scrolls horizontally. */
  maxWidth?: number;
  /** Optional label drawn over the top-left border of the outline. */
  title?: string;
  /** Background behind the title so it cuts the outline. Defaults to the theme background. */
  titleBackgroundColor?: string;
};

export function TextInput({
  value,
  onChangeText,
  onBlur,
  placeholder,
  size,
  hintSize,
  typography,
  accessibilityLabel,
  align = "center",
  minWidth,
  maxWidth,
  title,
  titleBackgroundColor,
}: TextInputProps) {
  const { background, text, image } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const iconSizeScale = useResolvedIconSizeScale();
  const editIconSize = Math.round(DESIGN_EDIT_ICON_SIZE * iconSizeScale);
  const fontSize = useResolvedConstantSize(size);
  const resolvedHintSize = useResolvedConstantSize(hintSize ?? size);
  const titleSize = useResolvedConstantSize(uiScale.filter.text.note);
  const typographyStyle = useResolvedTypography(typography);
  const isEmpty = value.trim().length === 0;
  const chromeWidth = editIconSize + EDIT_ICON_GAP + HORIZONTAL_PADDING * 2;
  const hintTextWidth = measureTextWidth(placeholder, resolvedHintSize, typographyStyle);
  const draftTextWidth = measureTextWidth(value, fontSize, typographyStyle);
  const contentTextWidth = Math.max(hintTextWidth, draftTextWidth);
  const naturalFieldWidth = contentTextWidth + chromeWidth;
  const fieldWidth = Math.min(
    maxWidth ?? naturalFieldWidth,
    Math.max(minWidth ?? naturalFieldWidth, naturalFieldWidth),
  );
  const textSlotWidth = Math.max(0, fieldWidth - chromeWidth);
  const overflows = draftTextWidth > textSlotWidth;
  const textAlign = align === "left" || overflows ? "left" : "center";
  const outlineColor = isEmpty
    ? image.profileDisplayNameErrorOutline
    : image.profileDisplayNameOutline;

  return (
    <View
      style={[
        styles.container,
        {
          width: fieldWidth,
          height: Math.max(fontSize, editIconSize) + 16,
          borderColor: outlineColor,
        },
      ]}
    >
      {title != null && title.length > 0 ? (
        <View
          pointerEvents="none"
          style={[
            styles.title,
            {
              backgroundColor: titleBackgroundColor ?? background,
              top: -Math.ceil(titleSize / 2),
            },
          ]}
        >
          <ConstantText
            size={uiScale.filter.text.note}
            typography={textStyle.filter.note}
            style={{ color: text.secondary }}
          >
            {title}
          </ConstantText>
        </View>
      ) : null}
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={isEmpty ? text.error : text.tertiary}
        autoCapitalize="words"
        autoCorrect={false}
        allowFontScaling={false}
        numberOfLines={1}
        scrollEnabled
        style={[
          typographyStyle,
          styles.field,
          {
            width: textSlotWidth,
            fontSize: isEmpty ? resolvedHintSize : fontSize,
            color: text.primary,
            textAlign,
          },
        ]}
        accessibilityLabel={accessibilityLabel}
      />
      <Image
        source={EDIT_ICON}
        style={{
          width: editIconSize,
          height: editIconSize,
          tintColor: isEmpty ? outlineColor : text.primary,
        }}
        contentFit="contain"
        accessibilityElementsHidden
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: EDIT_ICON_GAP,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  title: {
    position: "absolute",
    left: HORIZONTAL_PADDING,
    zIndex: 1,
    paddingHorizontal: TITLE_HORIZONTAL_PADDING,
  },
  field: {
    padding: 0,
    margin: 0,
  },
});
