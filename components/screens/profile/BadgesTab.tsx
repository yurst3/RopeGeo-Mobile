import { NoBadge } from "@/components/badges/profile/NoBadge";
import { Reporter1 } from "@/components/badges/profile/Reporter1";
import { Reporter2 } from "@/components/badges/profile/Reporter2";
import { Reporter3 } from "@/components/badges/profile/Reporter3";
import type { ProfileBadgeTier } from "@/components/badges/profile/ProfileBadge";
import { ConstantText } from "@/components/text/ConstantText";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { StyleSheet, ScrollView, View } from "react-native";
import type { UserAvatarBadgeIcon, UserAvatarFields } from "ropegeo-common/models";

export type ProfileBadgeId = "none" | "reporter1" | "reporter2" | "reporter3";

export const PROFILE_BADGE_TIER = {
  reporter1: "bronze",
  reporter2: "silver",
  reporter3: "gold",
} as const satisfies Record<Exclude<ProfileBadgeId, "none">, ProfileBadgeTier>;

export const PROFILE_BADGE_ICON = {
  reporter1: "tripReport",
  reporter2: "tripReport",
  reporter3: "tripReport",
} as const satisfies Record<Exclude<ProfileBadgeId, "none">, UserAvatarBadgeIcon>;

/** The badge fields of a user avatar for the badge picked on the profile. */
export function userAvatarBadgeFields(
  badge: ProfileBadgeId,
): Pick<UserAvatarFields, "badgeRank" | "badgeIcon"> {
  if (badge === "none") {
    return { badgeRank: null, badgeIcon: null };
  }
  return { badgeRank: PROFILE_BADGE_TIER[badge], badgeIcon: PROFILE_BADGE_ICON[badge] };
}

export function BadgesTab({
  selectedBadge,
  onSelectBadge,
}: {
  selectedBadge: ProfileBadgeId | null;
  onSelectBadge: (badge: ProfileBadgeId) => void;
}) {
  const noneSelected = selectedBadge == null || selectedBadge === "none";

  return (
    <ScrollView
      style={styles.tab}
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
    >
      <CategoryDivider title="Default" />
      <View style={styles.grid}>
        <View style={styles.cell}>
          <NoBadge
            selected={noneSelected}
            onPress={() => onSelectBadge("none")}
          />
        </View>
      </View>
      <CategoryDivider title="Social" />
      <View style={styles.grid}>
        <View style={styles.cell}>
          <Reporter1
            selected={selectedBadge === "reporter1"}
            onPress={() => onSelectBadge("reporter1")}
          />
        </View>
        <View style={styles.cell}>
          <Reporter2
            selected={selectedBadge === "reporter2"}
            onPress={() => onSelectBadge("reporter2")}
          />
        </View>
        <View style={styles.cell}>
          <Reporter3
            locked
            selected={selectedBadge === "reporter3"}
            onPress={() => onSelectBadge("reporter3")}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function CategoryDivider({ title }: { title: string }) {
  const { text, separator } = useColorTheme();
  const textStyle = useTextStyle();
  const uiScale = useUiScale();

  return (
    <View style={styles.category}>
      <ConstantText
        size={uiScale.filter.text.sectionTitle}
        typography={textStyle.filter.sectionTitle}
        style={{ color: text.secondary }}
      >
        {title}
      </ConstantText>
      <View style={[styles.categoryLine, { backgroundColor: separator }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
  },
  tabContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  category: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  categoryLine: {
    flex: 1,
    height: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  cell: {
    width: "33.333%",
    paddingHorizontal: 4,
    marginBottom: 16,
  },
});
