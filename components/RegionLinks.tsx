import { useRouter } from "expo-router";
import { PageDataSource } from "ropegeo-common/classes";
import React from "react";
import { StyleSheet, Text } from "react-native";

export type RegionLinksProps = {
  source: PageDataSource;
  regions: { id: string; name: string }[];
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
  containerStyle,
  styleAfterBlock,
  numberOfLines,
}: RegionLinksProps) {
  const router = useRouter();

  if (regions.length === 0) {
    return null;
  }

  const onRegionPress = (regionId: string) => {
    router.push({
      pathname: "/explore/[id]/region",
      params: { id: regionId, source },
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
          style={styles.regionLink}
          onPress={() => onRegionPress(region.id)}
        >
          {region.name}
        </Text>,
        ...(i < regions.length - 1
          ? [
              <Text key={`sep-${i}`} style={styles.regionSeparator}>
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
    color: "#3b82f6",
    textDecorationLine: "underline",
  },
  regionSeparator: {
    color: "#6b7280",
  },
});
