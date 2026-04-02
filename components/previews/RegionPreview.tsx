import { useRouter } from "expo-router";
import { PageDataSource, type RegionPreview as RegionPreviewData } from "ropegeo-common/classes";
import { useState } from "react";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const IMAGE_SIZE = 96;
const REGION_MAX = 3;
const REGION_ICON_SIZE = 28;
const NO_IMAGE_ICON_SIZE = 36;

function sourceIcon(source: PageDataSource): number | null {
  if (source === PageDataSource.Ropewiki) {
    return require("@/assets/images/icons/ropewiki.png");
  }
  return null;
}

function formatCounts(pageCount: number, regionCount: number): string {
  if (regionCount === 0) {
    return `(${pageCount} ${pageCount === 1 ? "page" : "pages"})`;
  }
  const pages = `${pageCount} ${pageCount === 1 ? "page" : "pages"}`;
  const regions = `${regionCount} ${regionCount === 1 ? "region" : "regions"}`;
  return `(${pages} and ${regions})`;
}

type Props = {
  preview: RegionPreviewData;
};

export function RegionPreview({ preview }: Props) {
  const router = useRouter();
  const [imageLoading, setImageLoading] = useState(!!preview.imageUrl);
  const regionLine =
    preview.parents?.length > 0
      ? preview.parents.slice(0, REGION_MAX).join(" • ")
      : "";
  const countsText = formatCounts(preview.pageCount, preview.regionCount);
  const icon = sourceIcon(preview.source);

  const onPress = () => {
    router.push({
      pathname: "/explore/[id]/region",
      params: { id: preview.id, source: preview.source },
    } as unknown as Parameters<typeof router.push>[0]);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.imageWrap}>
        {preview.imageUrl ? (
          <>
            {imageLoading && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="small" color="#6b7280" />
              </View>
            )}
            <Image
              source={preview.imageUrl}
              style={styles.image}
              contentFit="cover"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
          </>
        ) : (
          <View style={styles.noImageWrap}>
            <Image
              source={require("@/assets/images/icons/noImage.png")}
              style={[styles.noImageIcon, { width: NO_IMAGE_ICON_SIZE, height: NO_IMAGE_ICON_SIZE }]}
              contentFit="contain"
            />
          </View>
        )}
        <View style={styles.regionIconOverlay}>
          <Image
            source={require("@/assets/images/icons/region.png")}
            style={styles.regionIcon}
            contentFit="contain"
          />
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {preview.name}
        </Text>
        {regionLine ? (
          <Text style={styles.meta} numberOfLines={2}>
            {regionLine}
          </Text>
        ) : null}
        <Text style={styles.counts}>{countsText}</Text>
      </View>
      {icon != null ? (
        <Image source={icon} style={styles.sourceIcon} contentFit="contain" />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 12,
    padding: 3,
    marginBottom: 6,
  },
  cardPressed: {
    opacity: 0.9,
  },
  imageWrap: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#eee",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  noImageWrap: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageIcon: {},
  regionIconOverlay: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: REGION_ICON_SIZE,
    height: REGION_ICON_SIZE,
    borderRadius: REGION_ICON_SIZE / 2,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 2,
  },
  regionIcon: {
    width: 18,
    height: 18,
  },
  body: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  counts: {
    fontSize: 12,
    color: "#6b7280",
  },
  sourceIcon: {
    width: 56,
    height: 32,
    marginLeft: 8,
  },
});
