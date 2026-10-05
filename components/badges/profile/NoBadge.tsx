import { ConstantText } from "@/components/text/ConstantText";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedIconSizeScale } from "@/utils/theme/resolvers";
import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";

const CANCEL_ICON = require("@/assets/images/icons/buttons/cancel.png");
const DESIGN_BADGE_SIZE = 88;
const ICON_SCALE = 0.42;
const SELECTION_BORDER_WIDTH = 2;

export function NoBadge({
  selected = false,
  onPress,
}: {
  selected?: boolean;
  onPress?: () => void;
}) {
  const { text, button, badge } = useColorTheme();
  const highlightColor = button.standard.edit.iconHighlight ?? text.link;
  const textStyle = useTextStyle();
  const uiScale = useUiScale();
  const iconSizeScale = useResolvedIconSizeScale();
  const badgeSize = Math.round(DESIGN_BADGE_SIZE * iconSizeScale);
  const iconSize = Math.round(badgeSize * ICON_SCALE);

  return (
    <Pressable
      style={[
        styles.badge,
        { borderColor: selected ? highlightColor : "transparent" },
      ]}
      onPress={onPress}
      disabled={onPress == null}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel="No Badge"
    >
      <View
        style={[
          styles.circle,
          {
            width: badgeSize,
            height: badgeSize,
          },
        ]}
      >
        <Image
          source={CANCEL_ICON}
          style={{
            width: iconSize,
            height: iconSize,
            tintColor: badge.profileIcon.icon,
          }}
          contentFit="contain"
          accessibilityElementsHidden
        />
      </View>
      <ConstantText
        size={uiScale.filter.text.sectionTitle}
        typography={textStyle.pageScreen.title}
        style={[styles.title, { color: text.primary }]}
      >
        No Badge
      </ConstantText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    maxWidth: 148,
    borderWidth: SELECTION_BORDER_WIDTH,
    borderRadius: 16,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    alignSelf: "stretch",
    marginTop: 8,
    textAlign: "center",
  },
});
