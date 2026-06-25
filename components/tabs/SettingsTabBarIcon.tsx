import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

type Props = {
  size?: number;
  focused: boolean;
};

export function SettingsTabBarIcon({ size, focused }: Props) {
  const { tabBar } = useColorTheme();
  const iconColor = focused ? tabBar.iconFocused : tabBar.iconUnfocused;
  const dim = size ?? 26;

  return (
    <View style={styles.wrap}>
      <Image
        source={
          focused
            ? require("@/assets/images/icons/tabs/settings-solid.png")
            : require("@/assets/images/icons/tabs/settings.png")
        }
        style={[styles.icon, { width: dim, height: dim, tintColor: iconColor }]}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 999,
    padding: 4,
  },
  icon: {},
});
