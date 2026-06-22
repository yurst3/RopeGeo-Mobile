import { ConstantText } from "@/components/text/ConstantText";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useText } from "@/context/TextContext";
import { isSavedRopewikiPagePath } from "@/lib/navigation/savedPagePath";
import { usePathname, useRouter } from "expo-router";
import { PageDataSource } from "ropegeo-common/models";
import React from "react";
import { StyleSheet } from "react-native";

export type RegionLinksProps = {
  source: PageDataSource;
  regions: { id: string; name: string }[];
  /**
   * Ropewiki page id when rendered on a page screen; with a saved-tab pathname, region navigation
   * passes `savedPage` (this id) so the region screen can return to the Saved tab when appropriate.
   */
  pageId?: string;
  /** Optional container style (e.g. for margin). */
  containerStyle?: React.ComponentProps<typeof ConstantText>["style"];
  /** Optional style when rendered after another block (e.g. AKA). */
  styleAfterBlock?: React.ComponentProps<typeof ConstantText>["style"];
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
  const { uiScale, style: textStyle } = useText();
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
    <ConstantText
      size={uiScale.regionScreen.text.locationHierarchy}
      typography={textStyle.regionScreen.locationHierarchy}
      style={[styles.regionsContainer, containerStyle, styleAfterBlock]}
      numberOfLines={numberOfLines}
    >
      {regions.flatMap((region, i) => [
        <ConstantText
          key={`region-${region.id}`}
          size={uiScale.regionScreen.text.locationHierarchy}
          typography={textStyle.regionScreen.locationHierarchy}
          style={[styles.regionLink, { color: themeColors.text.link }]}
          onPress={() => onRegionPress(region.id)}
        >
          {region.name}
        </ConstantText>,
        ...(i < regions.length - 1
          ? [
              <ConstantText
                key={`sep-${i}`}
                size={uiScale.regionScreen.text.locationHierarchy}
                typography={textStyle.regionScreen.locationHierarchy}
                style={[
                  styles.regionSeparator,
                  { color: themeColors.text.secondary },
                ]}
              >
                {" "}•{" "}
              </ConstantText>,
            ]
          : []),
      ])}
    </ConstantText>
  );
}

const styles = StyleSheet.create({
  regionsContainer: {
    marginBottom: 10,
  },
  regionLink: {
    textDecorationLine: "underline",
  },
  regionSeparator: {},
});
