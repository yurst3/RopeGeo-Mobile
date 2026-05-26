import { useColorTheme } from "@/context/ColorThemeContext";
import { FontAwesome5 } from "@expo/vector-icons";
import { forwardRef, useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

/** Matches prior screen layout (`paddingVertical` 12 + 16px type). */
export const SEARCH_BAR_HEIGHT = 48;

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

  const barStyle = useMemo(
    () => [
      styles.bar,
      {
        backgroundColor: searchBar.background,
        shadowColor: searchBar.shadow,
      },
      style,
    ],
    [searchBar.background, searchBar.shadow, style],
  );

  const inputStyle = useMemo(
    () => [styles.input, { color: text.primary }],
    [text.primary],
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
        <FontAwesome5 name="search" size={16} color={searchBar.icon} />
        <Text style={[styles.placeholder, { color: text.tertiary }]}>
          {placeholder}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={barStyle}>
      <FontAwesome5 name="search" size={16} color={searchBar.icon} />
      <TextInput
        ref={ref}
        style={inputStyle}
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    minWidth: 0,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  placeholder: {
    flex: 1,
    fontSize: 16,
    minWidth: 0,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    minWidth: 0,
  },
});
