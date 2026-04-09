import { MiniDownloadButton } from "@/components/buttons/MiniDownloadButton";
import { StarRating } from "@/components/StarRating";
import { useDownloadQueue } from "@/context/DownloadQueueContext";
import { useSavedPages } from "@/context/SavedPagesContext";
import { DownloadPhase } from "@/lib/downloadQueue/downloadTask";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  AcaDifficulty,
  PageDataSource,
  type PagePreview as PagePreviewData,
  RouteType,
} from "ropegeo-common/models";

const IMAGE_SIZE = 96;
const NO_IMAGE_ICON_SIZE = 36;
/** Matches `RegionPreview` thumbnail badge sizing. */
const SOURCE_ICON_OVERLAY_SIZE = 28;
const REGION_MAX = 3;
/** Denominator for `(n/4)` label; numerator 0 = queued, 1–4 = active phases. */
const DOWNLOAD_STEP_COUNT = 4;

function formatPageDifficulty(d: AcaDifficulty): string {
  const main = [d.technical, d.water]
    .filter((x): x is NonNullable<typeof x> => x != null)
    .map((x) => String(x))
    .join("");
  const time = d.time != null ? ` ${String(d.time)}` : "";
  const riskForDisplay = d.additionalRisk;
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
  preview: PagePreviewData;
  /** `explore` (default): `/(tabs)/explore/[id]/page`. `saved`: `/(tabs)/saved/[id]/page`. */
  pageHref?: "explore" | "saved";
  /** When omitted, uses stored route type if saved, else `Unknown`. */
  routeType?: RouteType;
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
  routeType: routeTypeProp,
  showMiniDownload = false,
}: Props) {
  const router = useRouter();
  const { savedEntries, removeDownloadBundle } = useSavedPages();
  const { getTaskSnapshot, enqueueSavedPageDownload } = useDownloadQueue();
  const [imageLoading, setImageLoading] = useState(!!preview.imageUrl);
  const stored = savedEntries.find((e) => e.preview.id === preview.id);
  const routeForNav = routeTypeProp ?? stored?.routeType ?? RouteType.Unknown;

  let miniDownloadState: {
    downloading: boolean;
    isDownloaded: boolean;
    phaseProgress: number;
    /** 0 = queued; 1–4 = active steps (matches `DownloadTask` phases 1–4). */
    phaseStepForLabel: number | null;
  } | null = null;
  if (showMiniDownload && stored != null) {
    const task = getTaskSnapshot(preview.id);
    const downloading =
      task?.state === "queued" || task?.state === "running";
    const isDownloaded = stored.downloadedPageView != null;
    const phaseProgress =
      task != null &&
      (task.state === "queued" || task.state === "running")
        ? task.phaseProgress
        : 0;
    const phaseStepForLabel =
      downloading && task != null
        ? task.phase === DownloadPhase.Queued
          ? 0
          : Math.max(1, Math.min(DOWNLOAD_STEP_COUNT, task.phase))
        : null;
    miniDownloadState = {
      downloading,
      isDownloaded,
      phaseProgress,
      phaseStepForLabel,
    };
  }

  const onMiniDownloadPress = useCallback(() => {
    enqueueSavedPageDownload({ pageId: preview.id });
  }, [enqueueSavedPageDownload, preview.id]);

  const onMiniRemovePress = useCallback(() => {
    void removeDownloadBundle(preview.id);
  }, [preview.id, removeDownloadBundle]);
  const difficultyText =
    preview.difficulty instanceof AcaDifficulty
      ? formatPageDifficulty(preview.difficulty)
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
      routeType: routeForNav,
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
          {showMiniDownload && icon != null ? (
            <View style={styles.sourceIconOverlay} pointerEvents="none">
              <Image source={icon} style={styles.sourceIconOnImage} contentFit="contain" />
            </View>
          ) : null}
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {preview.title}
            </Text>
            {difficultyText ? (
              <Text style={styles.difficulty} numberOfLines={1}>
                {difficultyText}
              </Text>
            ) : null}
          </View>
          {preview.aka?.length > 0 ? (
            <Text style={[styles.meta, styles.akaLine]} numberOfLines={1}>
              <Text style={styles.meta}>AKA: </Text>
              <Text style={styles.akaNamesBold}>{preview.aka.join(", ")}</Text>
            </Text>
          ) : null}
          {regionLine ? (
            <Text style={styles.meta} numberOfLines={2}>
              {regionLine}
            </Text>
          ) : null}
          <StarRating
            rating={rating}
            count={ratingCount}
            size={14}
            emptyStarColor="#d1d5db"
            style={styles.stars}
            textStyle={styles.starText}
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
          {miniDownloadState.phaseStepForLabel != null ? (
            <Text style={styles.downloadPhaseLabel}>
              ({miniDownloadState.phaseStepForLabel}/{DOWNLOAD_STEP_COUNT})
            </Text>
          ) : null}
        </View>
      ) : !showMiniDownload && icon != null ? (
        <Image source={icon} style={styles.sourceIcon} contentFit="contain" />
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
    marginBottom: 6,
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
    backgroundColor: "#eee",
  },
  sourceIconOverlay: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: SOURCE_ICON_OVERLAY_SIZE,
    height: SOURCE_ICON_OVERLAY_SIZE,
    borderRadius: SOURCE_ICON_OVERLAY_SIZE / 2,
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
  sourceIconOnImage: {
    width: 18,
    height: 18,
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
  body: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginBottom: 2,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  difficulty: {
    fontSize: 16,
    color: "#374151",
  },
  meta: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  akaLine: {
    marginLeft: 12,
  },
  akaNamesBold: {
    fontWeight: "700",
  },
  stars: {
    marginTop: 2,
  },
  starText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#6b7280",
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
    color: "#4b5563",
  },
  /** Trailing column when `showMiniDownload` is false — same as `RegionPreview`. */
  sourceIcon: {
    width: 56,
    height: 32,
    marginLeft: 8,
  },
});
