import { useColorTheme } from "@/context/ColorThemeContext";
import { useResolvedButtonBackgroundScale } from "@/utils/resolvers";
import { useUiScale } from "@/context/UIScaleContext";
import { StyleSheet, View } from "react-native";

export type ColorSwatchProps = {
  primaryColor: string;
  secondaryColor: string;
  size?: number;
};

const DEFAULT_SIZE = 18;

export function ColorSwatch({
  primaryColor,
  secondaryColor,
  size = DEFAULT_SIZE,
}: ColorSwatchProps) {
  const { text } = useColorTheme();
  const uiScale = useUiScale();
  const chipSpec = uiScale.filter.buttons.chip;
  const backgroundScale = useResolvedButtonBackgroundScale(chipSpec);
  const dim = size * backgroundScale;
  const half = dim / 2;

  return (
    <View
      style={[
        styles.swatch,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          borderColor: text.primary,
        },
      ]}
    >
      <View style={[styles.primaryFill, { backgroundColor: primaryColor }]} />
      <View
        style={[
          styles.secondaryHalf,
          {
            backgroundColor: secondaryColor,
            width: dim * 1.5,
            height: dim * 1.5,
            left: half * 0.15,
            top: half * 0.85,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  swatch: {
    overflow: "hidden",
    borderWidth: 1,
  },
  primaryFill: {
    ...StyleSheet.absoluteFillObject,
  },
  secondaryHalf: {
    position: "absolute",
    transform: [{ rotate: "-45deg" }],
  },
});
