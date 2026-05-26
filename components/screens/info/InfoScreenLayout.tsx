import { BackButton } from "@/components/buttons/standard/BackButton";
import { useInfoScreenStyles } from "@/components/screens/info/infoScreenTheme";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Matches floating header controls on Ropewiki page / region screens. */
export const INFO_HEADER_ROW_TOP = 8;

export function InfoScreenLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = useInfoScreenStyles();

  return (
    <View style={styles.screen}>
      <BackButton
        onPress={() => router.back()}
        top={insets.top + INFO_HEADER_ROW_TOP}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + INFO_HEADER_ROW_TOP,
            paddingBottom: insets.bottom + 24,
            paddingLeft: 16 + insets.left,
            paddingRight: 16 + insets.right,
          },
        ]}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
        </View>
        {children}
      </ScrollView>
    </View>
  );
}
