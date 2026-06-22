import { useColorTheme } from "@/context/ColorThemeContext";
import { useText } from "@/context/TextContext";
import { UI_SCALE_PROFILES } from "@/constants/text";
import type { UiScaleProfile } from "@/constants/uiScale/types";
import type { TypographySpec } from "@/constants/text/style/types";
import {
  resolveButtonBackgroundScale,
  resolveButtonConstantTextSize,
  resolveButtonIconScale,
  resolveConstantTextSize,
  resolveTypographyStyle,
  useResolvedButtonBackgroundScale,
  useResolvedButtonConstantTextSize,
  useResolvedButtonIconScale,
  useResolvedTypography,
} from "@/utils/resolvers";
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
  type TextStyle,
  type ViewStyle,
} from "react-native";

export const SEARCH_BAR_PADDING_VERTICAL = 12;
export const SEARCH_BAR_PADDING_HORIZONTAL = 16;
export const SEARCH_BAR_GAP = 10;
/** Search glyph base size at medium profile (decoupled from text token). */
export const SEARCH_BAR_ICON_BASE_SIZE = 14;

export function getSearchBarMetrics(
  fontScale = 1,
  sizeProfile: UiScaleProfile = UI_SCALE_PROFILES.Auto,
) {
  const searchBarSpec = sizeProfile.map.buttons.searchBar;
  const fontSize =
    resolveButtonConstantTextSize(searchBarSpec, sizeProfile.global, fontScale) ??
    resolveConstantTextSize(
      { default: searchBarSpec.text?.default ?? 14 },
      sizeProfile.global,
      fontScale,
    );
  const backgroundScale = resolveButtonBackgroundScale(
    searchBarSpec,
    sizeProfile.global,
    fontScale,
  );
  const iconScale = resolveButtonIconScale(
    searchBarSpec,
    sizeProfile.global,
    fontScale,
  );
  const iconSize = SEARCH_BAR_ICON_BASE_SIZE * iconScale;
  const paddingVertical = SEARCH_BAR_PADDING_VERTICAL * backgroundScale;
  const paddingHorizontal = SEARCH_BAR_PADDING_HORIZONTAL * backgroundScale;
  const gap = SEARCH_BAR_GAP * backgroundScale;
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

export function getSearchBarTextStyle(
  typography: TypographySpec,
  fontProfile: ReturnType<typeof useText>["font"],
  sizeProfile: UiScaleProfile,
  fontScale: number,
  color: string,
): TextStyle {
  const searchBarSpec = sizeProfile.map.buttons.searchBar;
  const fontSize =
    resolveButtonConstantTextSize(searchBarSpec, sizeProfile.global, fontScale) ??
    14;
  return {
    ...resolveTypographyStyle(typography, fontProfile),
    fontSize,
    color,
    flex: 1,
    paddingVertical: 0,
    minWidth: 0,
  };
}

export function getSearchBarHeight(
  fontScale = 1,
  sizeProfile: UiScaleProfile = UI_SCALE_PROFILES.Auto,
): number {
  return getSearchBarMetrics(fontScale, sizeProfile).height;
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
  const textDef = useText();
  const searchBarSpec = textDef.uiScale.map.buttons.searchBar;
  const fontSize = useResolvedButtonConstantTextSize(searchBarSpec) ?? 14;
  const profileIconScale = useResolvedButtonIconScale(searchBarSpec);
  const iconSize = Math.round(SEARCH_BAR_ICON_BASE_SIZE * profileIconScale);
  const backgroundScale = useResolvedButtonBackgroundScale(searchBarSpec);
  const typographyStyle = useResolvedTypography(textDef.style.button.searchBar);

  const barStyle = useMemo(
    () => [
      styles.bar,
      {
        backgroundColor: searchBar.background,
        shadowColor: searchBar.shadow,
        paddingVertical: SEARCH_BAR_PADDING_VERTICAL * backgroundScale,
        paddingHorizontal: SEARCH_BAR_PADDING_HORIZONTAL * backgroundScale,
        gap: SEARCH_BAR_GAP * backgroundScale,
      },
      style,
    ],
    [
      searchBar.background,
      searchBar.shadow,
      backgroundScale,
      style,
    ],
  );

  const inputTextStyle = useMemo(
    () => [
      styles.text,
      typographyStyle,
      { color: text.primary, fontSize },
    ],
    [typographyStyle, text.primary, fontSize],
  );

  const placeholderTextStyle = useMemo(
    () => [
      styles.text,
      typographyStyle,
      { color: text.tertiary, fontSize },
    ],
    [typographyStyle, text.tertiary, fontSize],
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
          size={iconSize}
          color={searchBar.icon}
        />
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          ellipsizeMode="tail"
          style={placeholderTextStyle}
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
        size={iconSize}
        color={searchBar.icon}
      />
      <TextInput
        ref={ref}
        allowFontScaling={false}
        multiline={false}
        numberOfLines={1}
        style={inputTextStyle}
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
