import { ConstantText } from "@/components/text/ConstantText";
import { ScalingText } from "@/components/text/ScalingText";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useTextStyle } from "@/context/TextContext";
import { useUiScale } from "@/context/UIScaleContext";
import {
  PAGE_PREVIEW_TRAILING_MARGIN,
  PREVIEW_META_MAX_LINES,
  PREVIEW_TITLE_MAX_LINES,
  usePreviewLayoutMetrics,
} from "@/utils/previewLayout";
import { useFabulousTitle } from "@/utils/useFabulousTitle";
import { useRouter } from "expo-router";
import { PageDataSource, type RegionPreview as RegionPreviewData } from "ropegeo-common/models";
import { useState } from "react";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

const IMAGE_SIZE = 96;
const REGION_MAX = 3;

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
  const layoutMetrics = usePreviewLayoutMetrics();
  const uiScale = useUiScale();
  const style = useTextStyle();
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
  const displayTitle = useFabulousTitle(preview.name);
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
                  width: layoutMetrics.noImageIconSize,
                  height: layoutMetrics.noImageIconSize,
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
              width: layoutMetrics.regionIconOverlaySize,
              height: layoutMetrics.regionIconOverlaySize,
              borderRadius: layoutMetrics.regionIconOverlaySize / 2,
            },
          ]}
        >
          <Image
            source={require("@/assets/images/icons/region.png")}
            style={[
              styles.regionIcon,
              {
                width: layoutMetrics.regionIconInnerSize,
                height: layoutMetrics.regionIconInnerSize,
                tintColor: regionIcon,
              },
            ]}
            contentFit="contain"
          />
        </View>
      </View>
      <View style={styles.body}>
        <ScalingText
          size={uiScale.preview.text.title}
          typography={style.preview.title}
          numberOfLines={PREVIEW_TITLE_MAX_LINES}
          ellipsizeMode="tail"
          containerStyle={styles.titleWrap}
          measure={{
            type: "width",
            widthSafetyMargin: layoutMetrics.widthSafetyMargin,
          }}
          measureTextStyle={styles.titleMeasure}
          style={[styles.title, { color: text.primary }]}
        >
          {displayTitle}
        </ScalingText>
        <View style={styles.middleRow}>
          <View style={styles.metaColumn}>
            {regionLine ? (
              <ScalingText
                size={uiScale.preview.text.locationHierarchy}
                typography={style.preview.locationHierarchy}
                numberOfLines={PREVIEW_META_MAX_LINES}
                ellipsizeMode="tail"
                hideWhenEmpty
                measure={{
                  type: "lineCount",
                  maxLinesAtMaxSize: PREVIEW_META_MAX_LINES,
                  widthSafetyMargin: layoutMetrics.widthSafetyMargin,
                }}
                style={[styles.meta, { color: text.secondary }]}
              >
                {regionLine}
              </ScalingText>
            ) : null}
          </View>
          {icon != null ? (
            <View
              style={[
                styles.sourceIconCircle,
                styles.trailingControl,
                {
                  backgroundColor: sourceIconBackground,
                  shadowColor: buttonShadowColor,
                  width: layoutMetrics.sourceIconCircleSize,
                  height: layoutMetrics.sourceIconCircleSize,
                  borderRadius: layoutMetrics.sourceIconCircleSize / 2,
                },
              ]}
              pointerEvents="none"
            >
              <Image
                source={icon}
                style={{
                  width: layoutMetrics.regionSourceIconInnerSize,
                  height: layoutMetrics.regionSourceIconInnerSize,
                }}
                contentFit="contain"
              />
            </View>
          ) : null}
        </View>
        <ConstantText
          size={uiScale.preview.text.other}
          typography={style.preview.other}
          style={[styles.counts, { color: text.secondary }]}
        >
          {countsText}
        </ConstantText>
      </View>
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
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 2,
  },
  regionIcon: {},
  body: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    justifyContent: "center",
  },
  titleWrap: {
    marginBottom: 2,
  },
  titleMeasure: {
    textAlign: "center",
  },
  title: {
    textAlign: "left",
  },
  meta: {
    marginBottom: 2,
  },
  middleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  metaColumn: {
    flex: 1,
    minWidth: 0,
  },
  counts: {},
  sourceIconCircle: {
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  trailingControl: {
    marginLeft: PAGE_PREVIEW_TRAILING_MARGIN,
    alignItems: "center",
  },
});
