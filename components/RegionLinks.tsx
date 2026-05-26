import { useColorTheme } from "@/context/ColorThemeContext";
import { isSavedRopewikiPagePath } from "@/lib/navigation/savedPagePath";
import { usePathname, useRouter } from "expo-router";
import { PageDataSource } from "ropegeo-common/models";
import React from "react";
import { StyleSheet, Text } from "react-native";

export type RegionLinksProps = {
  source: PageDataSource;
  regions: { id: string; name: string }[];
  /**
   * Ropewiki page id when rendered on a page screen; with a saved-tab pathname, region navigation
   * passes `savedPage` (this id) so the region screen can return to the Saved tab when appropriate.
   */
  pageId?: string;
  /** Optional container style (e.g. for margin). */
  containerStyle?: React.ComponentProps<typeof Text>["style"];
  /** Optional style when rendered after another block (e.g. AKA). */
  styleAfterBlock?: React.ComponentProps<typeof Text>["style"];
  /** Optional numberOfLines for the container. */
  numberOfLines?: number;
};

export function RegionLinks({
  source,
  regions,
  pageId,
  containerStyle,
  styleAfterBlock,
  numberOfLines,
}: RegionLinksProps) {
  const themeColors = useColorTheme();
  const router = useRouter();
  const pathname = usePathname();

  if (regions.length === 0) {
    return null;
  }

  const onRegionPress = (regionId: string) => {
    const fromSavedPage =
      pageId != null &&
      pageId !== "" &&
      isSavedRopewikiPagePath(pathname ?? "");
    const params: Record<string, string> = {
      id: regionId,
      source: String(source),
    };
    if (fromSavedPage) {
      params.savedPage = pageId;
    }
    router.push({
      pathname: "/(tabs)/explore/[id]/region",
      params,
    } as unknown as Parameters<typeof router.push>[0]);
  };

  return (
    <Text
      style={[styles.regionsContainer, containerStyle, styleAfterBlock]}
      numberOfLines={numberOfLines}
    >
      {regions.flatMap((region, i) => [
        <Text
          key={`region-${region.id}`}
          style={[styles.regionLink, { color: themeColors.text.link }]}
          onPress={() => onRegionPress(region.id)}
        >
          {region.name}
        </Text>,
        ...(i < regions.length - 1
          ? [
              <Text
                key={`sep-${i}`}
                style={[styles.regionSeparator, { color: themeColors.text.secondary }]}
              >
                {" "}•{" "}
              </Text>,
            ]
          : []),
      ])}
    </Text>
  );
}

const styles = StyleSheet.create({
  regionsContainer: {
    fontSize: 16,
    marginBottom: 10,
  },
  regionLink: {
    textDecorationLine: "underline",
  },
  regionSeparator: {},
});
