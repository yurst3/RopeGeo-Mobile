import { MiniDownloadButton } from "@/components/buttons/nonstandard/MiniDownloadButton";
import { ConstantText } from "@/components/text/ConstantText";
import { ScalingTextGroup } from "@/components/text/ScalingTextGroup";
import { ScalingText } from "@/components/text/ScalingText";
import { StarRating } from "@/components/StarRating";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useDownloadJobQueue } from "@/context/DownloadJobQueueContext";
import { useSavedPages } from "@/context/SavedPagesContext";
import { useText } from "@/context/TextContext";
import {
  formatPreviewAkaLine,
  PAGE_PREVIEW_TRAILING_MARGIN,
  PREVIEW_AKA_NAMES_TAB,
  PREVIEW_META_MAX_LINES,
  PREVIEW_TITLE_MAX_LINES,
  usePreviewLayoutMetrics,
} from "@/utils/previewLayout";
import { useResolvedTypography } from "@/utils/resolvers";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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
  const layoutMetrics = usePreviewLayoutMetrics();
  const { uiScale, style } = useText();
  const { text, image, preview: previewColors, button } = themeColors;
  const akaBoldTypography = useMemo(
    () => ({ ...style.preview.akaNames, fontWeight: "700" as const }),
    [style.preview.akaNames],
  );
  const akaBoldStyle = useResolvedTypography(akaBoldTypography);
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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
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
                    width: layoutMetrics.noImageIconSize,
                    height: layoutMetrics.noImageIconSize,
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
                  width: layoutMetrics.imageSourceIconOverlaySize,
                  height: layoutMetrics.imageSourceIconOverlaySize,
                  borderRadius: layoutMetrics.imageSourceIconOverlaySize / 2,
                },
              ]}
              pointerEvents="none"
            >
              <Image
                source={icon}
                style={{
                  width: layoutMetrics.imageSourceIconInnerSize,
                  height: layoutMetrics.imageSourceIconInnerSize,
                }}
                contentFit="contain"
              />
            </View>
          ) : null}
        </View>
        <View style={styles.body}>
          <ScalingTextGroup
            containerStyle={styles.titleRow}
            gap={6}
            size={uiScale.preview.text.title}
            typography={style.preview.title}
            widthSafetyMargin={layoutMetrics.widthSafetyMargin}
          >
            <ScalingTextGroup.Segment
              flex={1}
              minWidth={0}
              numberOfLines={PREVIEW_TITLE_MAX_LINES}
              ellipsizeMode="tail"
              measureTextStyle={styles.titleMeasure}
              style={[styles.title, { color: text.primary }]}
            >
              {preview.title}
            </ScalingTextGroup.Segment>
            {difficultyText ? (
              <ScalingTextGroup.Segment
                flexShrink={0}
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.difficulty, { color: text.secondary }]}
              >
                {difficultyText}
              </ScalingTextGroup.Segment>
            ) : null}
          </ScalingTextGroup>
          <View style={styles.middleRow}>
            <View style={styles.metaColumn}>
              {preview.aka?.length > 0 ? (
                <ScalingText
                  size={uiScale.preview.text.akaNames}
                  typography={style.preview.akaNames}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  measure={{
                    type: "width",
                    widthSafetyMargin: layoutMetrics.widthSafetyMargin,
                  }}
                  measureTextStyle={akaBoldStyle}
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
                        <Text>{PREVIEW_AKA_NAMES_TAB}AKA: </Text>
                        <Text style={akaBoldStyle}>{akaNames}</Text>
                      </Text>
                    );
                  }}
                >
                  {formatPreviewAkaLine(preview.aka)}
                </ScalingText>
              ) : null}
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
            {showMiniDownload && miniDownloadState != null ? (
              <View style={styles.trailingControl} pointerEvents="box-none">
                <MiniDownloadButton
                  isDownloaded={miniDownloadState.isDownloaded}
                  downloading={miniDownloadState.downloading}
                  downloadPhaseProgress={miniDownloadState.phaseProgress}
                  onDownloadPress={onMiniDownloadPress}
                  onRemovePress={onMiniRemovePress}
                />
                {miniDownloadState.phaseStepForLabel != null &&
                miniDownloadState.phaseTotalForLabel != null ? (
                  <ConstantText
                    size={uiScale.preview.text.other}
                    typography={style.preview.other}
                    style={[styles.downloadPhaseLabel, { color: text.secondary }]}
                  >
                    {`(${miniDownloadState.phaseStepForLabel}/${miniDownloadState.phaseTotalForLabel})`}
                  </ConstantText>
                ) : null}
              </View>
            ) : !showMiniDownload && icon != null ? (
              <View
                style={[
                  styles.sourceIconCircle,
                  styles.trailingControl,
                  {
                    backgroundColor: sourceIconBackground,
                    shadowColor: button.shadowColor,
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
                    width: layoutMetrics.sourceIconInnerSize,
                    height: layoutMetrics.sourceIconInnerSize,
                  }}
                  contentFit="contain"
                />
              </View>
            ) : null}
          </View>
          <StarRating
            rating={rating}
            count={ratingCount}
            size={layoutMetrics.starRatingSize}
            allowFontScaling={false}
            style={styles.stars}
            textStyle={[
              styles.starText,
              { fontSize: layoutMetrics.starRatingFontSize },
            ]}
          />
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
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 2,
  },
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
    marginBottom: 2,
  },
  titleMeasure: {
    textAlign: "center",
  },
  title: {
    textAlign: "left",
  },
  difficulty: {
    textAlign: "center",
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
  akaLine: {
    marginBottom: 0,
  },
  stars: {
    marginTop: 2,
  },
  starText: {
    marginLeft: 4,
  },
  downloadPhaseLabel: {
    marginTop: 4,
  },
});
