import { useColorTheme } from "@/context/ColorThemeContext";
import { FontAwesome5 } from "@expo/vector-icons";
import { forwardRef, useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

export const SEARCH_BAR_FONT_SIZE = 16;
export const SEARCH_BAR_PADDING_VERTICAL = 12;
export const SEARCH_BAR_PADDING_HORIZONTAL = 16;
export const SEARCH_BAR_GAP = 10;
/** Max accessibility scale applied to search bar typography and padding. */
export const SEARCH_BAR_MAX_FONT_SCALE = 1.75;

export function getSearchBarMetrics(fontScale = 1) {
  const scale = Math.min(fontScale, SEARCH_BAR_MAX_FONT_SCALE);
  const fontSize = SEARCH_BAR_FONT_SIZE * scale;
  const iconSize = fontSize;
  const paddingVertical = SEARCH_BAR_PADDING_VERTICAL * scale;
  const paddingHorizontal = SEARCH_BAR_PADDING_HORIZONTAL * scale;
  const gap = SEARCH_BAR_GAP * scale;
  const height = Math.round(paddingVertical * 2 + fontSize);
  return {
    fontSize,
    iconSize,
    paddingVertical,
    paddingHorizontal,
    gap,
    height,
  };
}

export function getSearchBarHeight(fontScale = 1): number {
  return getSearchBarMetrics(fontScale).height;
}

/** Estimated height at default Dynamic Type scale (use {@link getSearchBarHeight} when `fontScale` ≠ 1). */
export const SEARCH_BAR_HEIGHT = getSearchBarHeight(1);

export type SearchBarProps = {
  placeholder: string;
  style?: StyleProp<ViewStyle>;
  /** Tap-to-navigate mode (Explore). Omit when using {@link TextInput} props below. */
  onPress?: () => void;
  accessibilityLabel?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  returnKeyType?: TextInputProps["returnKeyType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoCorrect?: TextInputProps["autoCorrect"];
};

export const SearchBar = forwardRef<TextInput, SearchBarProps>(function SearchBar(
  {
    placeholder,
    style,
    onPress,
    accessibilityLabel,
    value,
    onChangeText,
    returnKeyType = "search",
    autoCapitalize = "none",
    autoCorrect = false,
  },
  ref,
) {
  const themeColors = useColorTheme();
  const { searchBar, text } = themeColors;
  const { fontScale } = useWindowDimensions();
  const metrics = useMemo(
    () => getSearchBarMetrics(fontScale),
    [fontScale],
  );

  const barStyle = useMemo(
    () => [
      styles.bar,
      {
        backgroundColor: searchBar.background,
        shadowColor: searchBar.shadow,
        paddingVertical: metrics.paddingVertical,
        paddingHorizontal: metrics.paddingHorizontal,
        gap: metrics.gap,
      },
      style,
    ],
    [
      searchBar.background,
      searchBar.shadow,
      metrics.paddingVertical,
      metrics.paddingHorizontal,
      metrics.gap,
      style,
    ],
  );

  const textStyle = useMemo(
    () => [styles.text, { color: text.primary, fontSize: metrics.fontSize }],
    [text.primary, metrics.fontSize],
  );

  const placeholderStyle = useMemo(
    () => [styles.text, { color: text.tertiary, fontSize: metrics.fontSize }],
    [text.tertiary, metrics.fontSize],
  );

  const isPressable = onPress != null;

  if (isPressable) {
    return (
      <Pressable
        style={barStyle}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? placeholder}
      >
        <FontAwesome5
          name="search"
          size={metrics.iconSize}
          color={searchBar.icon}
        />
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          ellipsizeMode="tail"
          style={placeholderStyle}
        >
          {placeholder}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={barStyle}>
      <FontAwesome5
        name="search"
        size={metrics.iconSize}
        color={searchBar.icon}
      />
      <TextInput
        ref={ref}
        allowFontScaling={false}
        multiline={false}
        numberOfLines={1}
        style={textStyle}
        placeholder={placeholder}
        placeholderTextColor={text.tertiary}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        returnKeyType={returnKeyType}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    minWidth: 0,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  text: {
    flex: 1,
    paddingVertical: 0,
    minWidth: 0,
  },
});
