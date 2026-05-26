import { useColorTheme } from "@/context/ColorThemeContext";
import { useRouter } from "expo-router";
import { PageDataSource, type RegionPreview as RegionPreviewData } from "ropegeo-common/models";
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
const SOURCE_ICON_CIRCLE_SIZE = 32;
const SOURCE_ICON_INNER_SIZE = 18;
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
  const themeColors = useColorTheme();
  const { text, image } = themeColors;
  const { regionIconBackground, regionIcon, shadowColor, sourceIconBackground } =
    themeColors.preview.region;
  const { shadowColor: buttonShadowColor } = themeColors.button;
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
      <View style={[styles.imageWrap, { backgroundColor: image.background }]}>
        {preview.imageUrl ? (
          <>
            {imageLoading && (
              <View
                style={[
                  styles.imageLoadingOverlay,
                  { backgroundColor: image.background },
                ]}
              >
                <ActivityIndicator size="small" color={themeColors.loadingIndicator} />
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
          <View style={[styles.noImageWrap, { backgroundColor: image.background }]}>
            <Image
              source={require("@/assets/images/icons/noImage.png")}
              style={[
                styles.noImageIcon,
                {
                  width: NO_IMAGE_ICON_SIZE,
                  height: NO_IMAGE_ICON_SIZE,
                  tintColor: image.missingIcon,
                },
              ]}
              contentFit="contain"
            />
          </View>
        )}
        <View
          style={[
            styles.regionIconOverlay,
            {
              backgroundColor: regionIconBackground,
              shadowColor,
            },
          ]}
        >
          <Image
            source={require("@/assets/images/icons/region.png")}
            style={[styles.regionIcon, { tintColor: regionIcon }]}
            contentFit="contain"
          />
        </View>
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: text.primary }]} numberOfLines={2}>
          {preview.name}
        </Text>
        {regionLine ? (
          <Text style={[styles.meta, { color: text.secondary }]} numberOfLines={2}>
            {regionLine}
          </Text>
        ) : null}
        <Text style={[styles.counts, { color: text.secondary }]}>{countsText}</Text>
      </View>
      {icon != null ? (
        <View
          style={[
            styles.sourceIconCircle,
            {
              backgroundColor: sourceIconBackground,
              shadowColor: buttonShadowColor,
            },
          ]}
          pointerEvents="none"
        >
          <Image source={icon} style={styles.sourceIconInner} contentFit="contain" />
        </View>
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
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
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
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    marginBottom: 2,
  },
  counts: {
    fontSize: 12,
  },
  sourceIconCircle: {
    marginLeft: 8,
    width: SOURCE_ICON_CIRCLE_SIZE,
    height: SOURCE_ICON_CIRCLE_SIZE,
    borderRadius: SOURCE_ICON_CIRCLE_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  sourceIconInner: {
    width: SOURCE_ICON_INNER_SIZE,
    height: SOURCE_ICON_INNER_SIZE,
  },
});
