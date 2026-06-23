import type { TypographySpec } from "@/constants/text/style/types";
import type { ConstantTextSizeSpec, UiScaleGlobal } from "@/constants/uiScale/types";
import { useTextStyle } from "@/context/TextContext";
import { useUiScale } from "@/context/UIScaleContext";
import {
  resolveConstantTextSize,
  useResolvedButtonBackgroundScale,
  useResolvedTypography,
} from "@/utils/resolvers";
import { useFilterTheme } from "@/components/filters/useFilterTheme";
import { useWindowDimensions, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";
import type { StyleProp, TextStyle } from "react-native";

const CHIP_PADDING_VERTICAL = 8;
const CHIP_PADDING_HORIZONTAL = 12;
const CHIP_BORDER_RADIUS = 20;
const LEADING_GAP = 6;

export type OptionChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  leading?: ReactNode;
  labelTypography?: TypographySpec;
  labelSize?: ConstantTextSizeSpec;
  /** Overrides active UI scale when resolving {@link labelSize}. */
  labelGlobal?: UiScaleGlobal;
  labelStyle?: StyleProp<TextStyle>;
};

export function OptionChip({
  label,
  selected,
  onPress,
  leading,
  labelTypography,
  labelSize,
  labelGlobal,
  labelStyle,
}: OptionChipProps) {
  const { filter, text, cardHighlight } = useFilterTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const { fontScale } = useWindowDimensions();
  const { checkbox } = filter;
  const chipSpec = uiScale.filter.buttons.chip;
  const backgroundScale = useResolvedButtonBackgroundScale(chipSpec);

  const resolvedTypography =
    labelTypography ??
    (selected ? textStyle.filter.sectionTitle : textStyle.filter.optionLabel);
  const resolvedSize = labelSize ?? chipSpec.text!;
  const sizeGlobal = labelGlobal ?? uiScale.global;
  const labelFontSize = resolveConstantTextSize(
    resolvedSize,
    sizeGlobal,
    fontScale,
  );
  const typographyStyle = useResolvedTypography(resolvedTypography);

  const labelColor = selected ? text.link : text.secondary;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: selected ? checkbox.checkedFill : cardHighlight,
          borderColor: selected ? checkbox.checkedOutline : checkbox.uncheckedOutline,
          paddingVertical: CHIP_PADDING_VERTICAL * backgroundScale,
          paddingHorizontal: CHIP_PADDING_HORIZONTAL * backgroundScale,
          borderRadius: CHIP_BORDER_RADIUS * backgroundScale,
        },
      ]}
    >
      {leading != null ? (
        <View style={[styles.leading, { marginRight: LEADING_GAP * backgroundScale }]}>
          {leading}
        </View>
      ) : null}
      <View style={[styles.labelSlot, { height: labelFontSize }]}>
        <Text
          allowFontScaling={false}
          {...(Platform.OS === "android" ? { includeFontPadding: false } : {})}
          style={[
            labelStyle == null ? typographyStyle : null,
            labelStyle,
            styles.labelText,
            {
              fontSize: labelFontSize,
              lineHeight: labelFontSize,
              color: labelColor,
            },
            Platform.OS === "ios"
              ? { transform: [{ translateY: Math.round(labelFontSize * 0.06) }] }
              : null,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
  },
  leading: {
    justifyContent: "center",
    alignItems: "center",
  },
  labelSlot: {
    justifyContent: "center",
  },
  labelText: {
    margin: 0,
    padding: 0,
    ...Platform.select({
      android: { textAlignVertical: "center" as const },
      default: {},
    }),
  },
});
