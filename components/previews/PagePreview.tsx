import { MiniDownloadButton } from "@/components/buttons/nonstandard/MiniDownloadButton";
import { ScalingText } from "@/components/ScalingText";
import { StarRating } from "@/components/StarRating";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useDownloadJobQueue } from "@/context/DownloadJobQueueContext";
import { useSavedPages } from "@/context/SavedPagesContext";
import {
  PREVIEW_META_MAX_LINES,
  PREVIEW_TITLE_MAX_LINES,
  usePreviewTextMetrics,
} from "@/utils/previewLayout";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  AcaDifficultyRating,
  type OfflinePagePreview,
  type OnlinePagePreview,
  PageDataSource,
} from "ropegeo-common/models";

const IMAGE_SIZE = 96;
const NO_IMAGE_ICON_SIZE = 36;
/** Circular badge on thumbnail (matches `RegionPreview` region icon overlay). */
const SOURCE_ICON_OVERLAY_SIZE = 28;
/** Trailing-column source logo circle (no border; shadow like `ExternalLinkButton`). */
const SOURCE_ICON_CIRCLE_SIZE = 32;
const SOURCE_ICON_INNER_SIZE = 18;
const REGION_MAX = 3;
function formatPageDifficulty(d: AcaDifficultyRating): string {
  const main = [d.technical, d.water]
    .filter((x): x is NonNullable<typeof x> => x != null)
    .map((x) => String(x))
    .join("");
  const time = d.time != null ? ` ${String(d.time)}` : "";
  const riskForDisplay = d.additionalRisk ? d.effectiveRisk : null;
  const riskPart =
    riskForDisplay != null ? ` ${String(riskForDisplay)}` : "";
  return (main + time + riskPart).trim();
}

function sourceIcon(source: PageDataSource): number | null {
  if (source === PageDataSource.Ropewiki) {
    return require("@/assets/images/icons/ropewiki.png");
  }
  return null;
}

type Props = {
  preview: OnlinePagePreview | OfflinePagePreview;
  /** `explore` (default): `/(tabs)/explore/[id]/page`. `saved`: `/(tabs)/saved/[id]/page`. */
  pageHref?: "explore" | "saved";
  /**
   * When true: Ropewiki badge is overlaid on the thumbnail and `MiniDownloadButton` sits in
   * the trailing column. When false: matches `RegionPreview` (source logo in the right column,
   * no overlay on the image).
   */
  showMiniDownload?: boolean;
};

export function PagePreview({
  preview,
  pageHref = "explore",
  showMiniDownload = false,
}: Props) {
  const themeColors = useColorTheme();
  const textMetrics = usePreviewTextMetrics();
  const { text, image, preview: previewColors, button } = themeColors;
  const { sourceIconBackground } = previewColors.page;
  const router = useRouter();
  const { savedEntries, removeDownloadBundle } = useSavedPages();
  const { getJobUISnapshot, enqueueSavedPageDownload } = useDownloadJobQueue();
  const previewImageUri =
    preview.fetchType === "online"
      ? preview.imageUrl
      : preview.downloadedImagePath;
  const [imageLoading, setImageLoading] = useState(!!previewImageUri);
  const stored = savedEntries.find((e) => e.preview.id === preview.id);

  let miniDownloadState: {
    downloading: boolean;
    isDownloaded: boolean;
    phaseProgress: number;
    phaseStepForLabel: number | null;
    phaseTotalForLabel: number | null;
  } | null = null;
  if (showMiniDownload && stored != null) {
    const job = getJobUISnapshot(preview.id);
    const downloading =
      job?.state === "queued" || job?.state === "running";
    const isDownloaded = stored.downloadedPageViewPath != null;
    const phaseProgress =
      job != null &&
      (job.state === "queued" || job.state === "running")
        ? job.phaseProgress
        : 0;
    const showStepLabel =
      downloading && job != null && job.displayTotal > 0;
    miniDownloadState = {
      downloading,
      isDownloaded,
      phaseProgress,
      phaseStepForLabel: showStepLabel ? job.displayStep : null,
      phaseTotalForLabel: showStepLabel ? job.displayTotal : null,
    };
  }

  const onMiniDownloadPress = useCallback(() => {
    enqueueSavedPageDownload({ pageId: preview.id });
  }, [enqueueSavedPageDownload, preview.id]);

  const onMiniRemovePress = useCallback(() => {
    void removeDownloadBundle(preview.id);
  }, [preview.id, removeDownloadBundle]);
  const difficultyText =
    preview.difficultyRating instanceof AcaDifficultyRating
      ? formatPageDifficulty(preview.difficultyRating)
      : "";
  const regionLine =
    preview.regions?.length > 0
      ? preview.regions.slice(0, REGION_MAX).join(" • ")
      : "";
  const rating = preview.rating ?? 0;
  const ratingCount = preview.ratingCount ?? 0;
  const [titleFontSize, setTitleFontSize] = useState(
    textMetrics.titleMaxFontSize,
  );
  const [difficultyWidthAtMax, setDifficultyWidthAtMax] = useState(0);

  useEffect(() => {
    setTitleFontSize(textMetrics.titleMaxFontSize);
  }, [
    preview.title,
    textMetrics.fontScale,
    textMetrics.titleMaxFontSize,
  ]);

  useEffect(() => {
    setDifficultyWidthAtMax(0);
  }, [difficultyText, textMetrics.titleMaxFontSize]);

  const onTitleFontSizeChange = useCallback((fontSize: number) => {
    setTitleFontSize((prev) =>
      Math.abs(prev - fontSize) < 0.25 ? prev : fontSize,
    );
  }, []);

  const icon = sourceIcon(preview.source);

  const onPress = () => {
    if (preview.source !== PageDataSource.Ropewiki) return;
    const params = {
      id: preview.id,
      source: PageDataSource.Ropewiki,
    };
    if (pageHref === "saved") {
      router.push({
        pathname: "/(tabs)/saved/[id]/page",
        params,
      } as unknown as Parameters<typeof router.push>[0]);
      return;
    }
    router.push({
      pathname: "/(tabs)/explore/[id]/page",
      params,
    } as unknown as Parameters<typeof router.push>[0]);
  };

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.cardMain, pressed && styles.cardPressed]}
      >
        <View style={[styles.imageWrap, { backgroundColor: image.background }]}>
          {previewImageUri ? (
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
                source={previewImageUri}
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
          {showMiniDownload && icon != null ? (
            <View
              style={[
                styles.sourceIconOverlay,
                {
                  backgroundColor: sourceIconBackground,
                  shadowColor: button.shadowColor,
                },
              ]}
              pointerEvents="none"
            >
              <Image source={icon} style={styles.sourceIconOnImage} contentFit="contain" />
            </View>
          ) : null}
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <ScalingText
              containerStyle={styles.titleFlex}
              maxFontSize={textMetrics.titleMaxFontSize}
              minFontSize={textMetrics.titleMinFontSize}
              numberOfLines={PREVIEW_TITLE_MAX_LINES}
              ellipsizeMode="tail"
              measureKey={textMetrics.fontScale}
              onFontSizeChange={onTitleFontSizeChange}
              measure={{
                type: "width",
                widthSafetyMargin: textMetrics.widthSafetyMargin,
              }}
              measureTextStyle={styles.titleMeasure}
              style={[styles.title, { color: text.primary }]}
            >
              {preview.title}
            </ScalingText>
            {difficultyText ? (
              <View
                style={[
                  styles.difficultySlot,
                  difficultyWidthAtMax > 0
                    ? { minWidth: difficultyWidthAtMax }
                    : null,
                ]}
              >
                {difficultyWidthAtMax === 0 ? (
                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    style={[
                      styles.difficultyMeasure,
                      { fontSize: textMetrics.titleMaxFontSize },
                    ]}
                    onTextLayout={(event) => {
                      const width = event.nativeEvent.lines[0]?.width ?? 0;
                      if (width > 0) {
                        setDifficultyWidthAtMax(width);
                      }
                    }}
                  >
                    {difficultyText}
                  </Text>
                ) : null}
                <Text
                  allowFontScaling={false}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[
                    styles.difficulty,
                    { color: text.secondary, fontSize: titleFontSize },
                  ]}
                >
                  {difficultyText}
                </Text>
              </View>
            ) : null}
          </View>
          {preview.aka?.length > 0 ? (
            <ScalingText
              containerStyle={styles.akaRow}
              maxFontSize={textMetrics.metaMaxFontSize}
              minFontSize={textMetrics.metaMinFontSize}
              numberOfLines={1}
              ellipsizeMode="tail"
              measureKey={textMetrics.fontScale}
              measure={{
                type: "width",
                widthSafetyMargin: textMetrics.widthSafetyMargin,
              }}
              measureTextStyle={styles.akaNamesBold}
              renderLabel={(fontSize) => {
                const akaNames = preview.aka.join(", ");
                return (
                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.meta,
                      styles.akaLine,
                      { color: text.secondary, fontSize },
                    ]}
                  >
                    <Text>AKA: </Text>
                    <Text style={styles.akaNamesBold}>{akaNames}</Text>
                  </Text>
                );
              }}
            >
              {`AKA: ${preview.aka.join(", ")}`}
            </ScalingText>
          ) : null}
          {regionLine ? (
            <ScalingText
              maxFontSize={textMetrics.metaMaxFontSize}
              minFontSize={textMetrics.metaMinFontSize}
              numberOfLines={PREVIEW_META_MAX_LINES}
              ellipsizeMode="tail"
              hideWhenEmpty
              measureKey={textMetrics.fontScale}
              measure={{
                type: "lineCount",
                maxLinesAtMaxSize: PREVIEW_META_MAX_LINES,
                widthSafetyMargin: textMetrics.widthSafetyMargin,
              }}
              style={[styles.meta, { color: text.secondary }]}
            >
              {regionLine}
            </ScalingText>
          ) : null}
          <StarRating
            rating={rating}
            count={ratingCount}
            size={textMetrics.starRatingSize}
            allowFontScaling={false}
            style={styles.stars}
            textStyle={[
              styles.starText,
              { fontSize: textMetrics.starRatingFontSize },
            ]}
          />
        </View>
      </Pressable>
      {showMiniDownload && miniDownloadState != null ? (
        <View style={styles.downloadRail}>
          <MiniDownloadButton
            isDownloaded={miniDownloadState.isDownloaded}
            downloading={miniDownloadState.downloading}
            downloadPhaseProgress={miniDownloadState.phaseProgress}
            onDownloadPress={onMiniDownloadPress}
            onRemovePress={onMiniRemovePress}
          />
          {miniDownloadState.phaseStepForLabel != null &&
          miniDownloadState.phaseTotalForLabel != null ? (
            <Text style={[styles.downloadPhaseLabel, { color: text.secondary }]}>
              {`(${miniDownloadState.phaseStepForLabel}/${miniDownloadState.phaseTotalForLabel})`}
            </Text>
          ) : null}
        </View>
      ) : !showMiniDownload && icon != null ? (
        <View
          style={[
            styles.sourceIconCircle,
            {
              backgroundColor: sourceIconBackground,
              shadowColor: button.shadowColor,
            },
          ]}
          pointerEvents="none"
        >
          <Image source={icon} style={styles.sourceIconInner} contentFit="contain" />
        </View>
      ) : null}
    </View>
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
  cardMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  cardPressed: {
    opacity: 0.9,
  },
  imageWrap: {
    position: "relative",
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 8,
    overflow: "hidden",
  },
  sourceIconOverlay: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: SOURCE_ICON_OVERLAY_SIZE,
    height: SOURCE_ICON_OVERLAY_SIZE,
    borderRadius: SOURCE_ICON_OVERLAY_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 2,
  },
  sourceIconOnImage: {
    width: SOURCE_ICON_INNER_SIZE,
    height: SOURCE_ICON_INNER_SIZE,
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
  body: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  titleFlex: {
    flex: 1,
    minWidth: 0,
  },
  titleMeasure: {
    fontWeight: "700",
    textAlign: "center",
  },
  title: {
    fontWeight: "700",
    textAlign: "left",
  },
  difficultySlot: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  difficultyMeasure: {
    position: "absolute",
    opacity: 0,
    left: 0,
    top: 0,
  },
  difficulty: {
    textAlign: "center",
  },
  meta: {
    marginBottom: 2,
  },
  akaRow: {
    marginLeft: 12,
    marginBottom: 2,
    minWidth: 0,
  },
  akaLine: {
    marginBottom: 0,
  },
  akaNamesBold: {
    fontWeight: "700",
  },
  stars: {
    marginTop: 2,
  },
  starText: {
    marginLeft: 4,
  },
  downloadRail: {
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 40,
    gap: 4,
  },
  downloadPhaseLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
});
