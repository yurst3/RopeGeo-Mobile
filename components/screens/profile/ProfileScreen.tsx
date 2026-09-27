import { ProfileLoginSection } from "@/components/screens/profile/ProfileLoginSection";
import { SettingsBottomSheet } from "@/components/modals/SettingsBottomSheet";
import { SettingsButton } from "@/components/buttons/standard/SettingsButton";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useHeaderChromeLayout } from "@/utils/layout/buttonChromeLayout";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function ProfileScreen() {
  const { background } = useColorTheme();
  const insets = useSafeAreaInsets();
  const headerChrome = useHeaderChromeLayout();
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);

  return (
    <View style={[styles.screen, { backgroundColor: background }]}>
      <View
        style={[
          styles.settingsButton,
          {
            top: insets.top + headerChrome.rowTopInset,
            right: insets.right + headerChrome.edgeInset,
          },
        ]}
      >
        <SettingsButton onPress={() => setSettingsSheetOpen(true)} />
      </View>

      <View
        style={[
          styles.loginHost,
          {
            paddingTop: insets.top + headerChrome.rowTopInset + 48,
            paddingLeft: 16 + insets.left,
            paddingRight: 16 + insets.right,
            paddingBottom: 16,
          },
        ]}
      >
        <ProfileLoginSection />
      </View>

      <SettingsBottomSheet
        visible={settingsSheetOpen}
        onClose={() => setSettingsSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  settingsButton: {
    position: "absolute",
    zIndex: 1,
  },
  loginHost: {
    flex: 1,
  },
});
