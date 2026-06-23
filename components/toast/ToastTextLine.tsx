import { ConstantText } from "@/components/text/ConstantText";
import { ScalingText } from "@/components/text/ScalingText";
import type { ConstantTextSizeSpec, ScalingTextSizeSpec } from "@/constants/uiScale/types";
import type { TypographySpec } from "@/constants/text/style/types";
import { View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";

export type ToastTextLineProps = {
  /** When set, uses {@link ScalingText} capped to this many lines; otherwise {@link ConstantText}. */
  maxLines?: number;
  size: ScalingTextSizeSpec;
  typography: TypographySpec;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  children: string;
};

function constantSizeFromScaling(spec: ScalingTextSizeSpec): ConstantTextSizeSpec {
  return {
    default: spec.default,
    floor: spec.floor,
    ceiling: spec.ceiling,
    accessibilityScaling: spec.accessibilityScaling,
  };
}

export function ToastTextLine({
  maxLines,
  size,
  typography,
  style,
  containerStyle,
  children,
}: ToastTextLineProps) {
  if (maxLines != null) {
    return (
      <ScalingText
        size={size}
        typography={typography}
        numberOfLines={maxLines}
        ellipsizeMode="tail"
        measure={{ type: "lineCount", maxLinesAtMaxSize: maxLines }}
        containerStyle={containerStyle}
        style={style}
      >
        {children}
      </ScalingText>
    );
  }

  const text = (
    <ConstantText
      size={constantSizeFromScaling(size)}
      typography={typography}
      style={style}
    >
      {children}
    </ConstantText>
  );

  if (containerStyle != null) {
    return <View style={containerStyle}>{text}</View>;
  }
  return text;
}
