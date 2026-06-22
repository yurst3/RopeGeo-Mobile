import type { ConstantTextSizeSpec } from "@/constants/uiScale/types";
import type { TypographySpec } from "@/constants/text/style/types";
import {
  useResolvedConstantSize,
  useResolvedTypography,
} from "@/utils/resolvers";
import {
  Text,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from "react-native";

export type ConstantTextProps = Omit<TextProps, "allowFontScaling"> & {
  size: ConstantTextSizeSpec;
  typography: TypographySpec;
  style?: StyleProp<TextStyle>;
};

export function ConstantText({
  size,
  typography,
  style,
  ...rest
}: ConstantTextProps) {
  const fontSize = useResolvedConstantSize(size);
  const typographyStyle = useResolvedTypography(typography);

  return (
    <Text
      allowFontScaling={false}
      {...rest}
      style={[typographyStyle, { fontSize }, style]}
    />
  );
}
