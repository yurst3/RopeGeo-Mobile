import { isPageMiniMapType } from "@/components/modals/minimap/shared/minimapShared";
import { useNetworkStatus } from "@/context/app/NetworkStatusContext";
import { useMapOverlayColors } from "@/hooks/map/useMapOverlayColors";
import {
  pagePointIconSymbolStyle,
  pagePointLabelSymbolStyle,
} from "@/utils/explore/mapMarkerLayerStyles";
import { pageMiniMapPointIconSize } from "@/utils/explore/routeMarkerIcons";
import { useRouteMarkerMetrics } from "@/utils/layout/routeMarkerLayout";
import {
  ROUTE_MARKER_IMAGE,
  ROUTE_MARKER_NATIVE_ASSET_IMAGES,
} from "@/utils/mapbox/nativeMarkerImages";
import { trailVectorLineStyle } from "@/utils/minimap/trailVectorLineStyle";
import { REQUEST_TIMEOUT_SECONDS } from "@/utils/network/requestTimeout";
import {
  offlineVectorTilesRootFromTemplate,
  prepareOfflineVectorTilesForMapbox,
} from "@/utils/offline/prepareOfflineVectorTiles";
import { useMapMarkerTextFont } from "@/utils/theme/resolvers";
import {
  FillLayer,
  Images,
  LineLayer,
  SymbolLayer,
  VectorSource,
  type FillLayerStyle,
  type LineLayerStyle,
  type SymbolLayerStyle,
} from "@rnmapbox/maps";
import * as FileSystem from "expo-file-system/legacy";
import { useEffect, useMemo, useState } from "react";
import { Method, RopeGeoDataLoader, Service } from "ropegeo-common/components";
import {
  OfflineRopewikiPageView,
  type OfflinePageMiniMap,
  type OnlinePageMiniMap,
  type RopewikiPageView,
  type SavedPage,
} from "ropegeo-common/models";

/** Ghost routes draw faded so they read as a backdrop to the trip report's features. */
const GHOST_ROUTE_OPACITY = 0.8;
const GHOST_ROUTE_EMISSIVE_STRENGTH = 0.8;
/** Every ghost line is dashed; lengths are multiples of the line width. */
const GHOST_ROUTE_DASH_ARRAY = [0.2, 1.5];
/** The trip report's own area fill opacity (0.25), scaled by {@link GHOST_ROUTE_OPACITY}. */
const GHOST_ROUTE_AREA_FILL_OPACITY = 0.25 * GHOST_ROUTE_OPACITY;
/**
 * The Standard style's middle slot sits below the `top` slot that holds every trip report layer,
 * so the ghost route stays behind them however late it loads.
 */
const GHOST_ROUTE_SLOT = "middle" as const;

const LINE_OR_POLYGON_FILTER = [
  "any",
  ["==", ["geometry-type"], "LineString"],
  ["==", ["geometry-type"], "Polygon"],
] as const;
const POLYGON_FILTER = ["==", ["geometry-type"], "Polygon"] as const;
const POINT_FILTER = ["==", ["geometry-type"], "Point"] as const;

/**
 * The downloaded page view at `path`: undefined when there's no download (or it can't be read,
 * so the page loads online instead), null while it's being read.
 */
function useDownloadedPageView(path: string | null): OfflineRopewikiPageView | null | undefined {
  const [loaded, setLoaded] = useState<{
    path: string;
    view: OfflineRopewikiPageView | null;
  } | null>(null);

  useEffect(() => {
    if (path == null) return;
    let cancelled = false;
    void (async () => {
      let view: OfflineRopewikiPageView | null = null;
      try {
        const text = await FileSystem.readAsStringAsync(path);
        view = OfflineRopewikiPageView.fromResult(JSON.parse(text) as unknown);
      } catch (error) {
        console.warn("[GhostRouteLayer] couldn't read the downloaded page; loading it online", error);
      }
      if (!cancelled) setLoaded({ path, view });
    })();
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (path == null) return undefined;
  if (loaded == null || loaded.path !== path) return null;
  return loaded.view ?? undefined;
}

/** A page minimap's vector tiles drawn as a faded, dashed ghost route. */
function GhostRouteTiles({ miniMap }: { miniMap: OnlinePageMiniMap | OfflinePageMiniMap }) {
  const overlay = useMapOverlayColors();
  const markerMetrics = useRouteMarkerMetrics();
  const markerTextFont = useMapMarkerTextFont();
  const isOffline = miniMap.fetchType === "offline";
  const tileTemplate = isOffline
    ? (miniMap as OfflinePageMiniMap).offlineTilesTemplate
    : (miniMap as OnlinePageMiniMap).onlineTilesTemplate;

  // Downloaded tiles are gzipped on disk; Mapbox needs them unzipped before it can read them.
  const [preparedTemplate, setPreparedTemplate] = useState<string | null>(null);
  useEffect(() => {
    if (!isOffline) return;
    let cancelled = false;
    void (async () => {
      const tilesRoot = offlineVectorTilesRootFromTemplate(tileTemplate);
      if (tilesRoot != null) {
        try {
          await prepareOfflineVectorTilesForMapbox(tilesRoot);
        } catch (error) {
          console.warn("[GhostRouteLayer] couldn't prepare the downloaded tiles", error);
        }
      }
      if (!cancelled) setPreparedTemplate(tileTemplate);
    })();
    return () => {
      cancelled = true;
    };
  }, [isOffline, tileTemplate]);

  const lineStyle = useMemo(
    (): LineLayerStyle => ({
      ...trailVectorLineStyle(overlay.focusedLineSegment),
      lineOpacity: GHOST_ROUTE_OPACITY,
      lineEmissiveStrength: GHOST_ROUTE_EMISSIVE_STRENGTH,
      lineDasharray: GHOST_ROUTE_DASH_ARRAY,
    }),
    [overlay.focusedLineSegment],
  );
  const fillStyle = useMemo(
    (): FillLayerStyle => ({
      fillColor: ["coalesce", ["get", "fill"], overlay.focusedLineSegment],
      fillOpacity: GHOST_ROUTE_AREA_FILL_OPACITY,
      fillEmissiveStrength: GHOST_ROUTE_EMISSIVE_STRENGTH,
    }),
    [overlay.focusedLineSegment],
  );
  const iconStyle = useMemo(
    (): SymbolLayerStyle => ({
      ...pagePointIconSymbolStyle(
        overlay.marker,
        ROUTE_MARKER_IMAGE,
        pageMiniMapPointIconSize(null, markerMetrics.iconSizeScale),
      ),
      iconOpacity: GHOST_ROUTE_OPACITY,
      iconEmissiveStrength: GHOST_ROUTE_EMISSIVE_STRENGTH,
    }),
    [overlay.marker, markerMetrics.iconSizeScale],
  );
  const labelStyle = useMemo(
    (): SymbolLayerStyle => ({
      ...pagePointLabelSymbolStyle(overlay.marker, markerMetrics, markerTextFont),
      textOpacity: GHOST_ROUTE_OPACITY,
      textEmissiveStrength: GHOST_ROUTE_EMISSIVE_STRENGTH,
    }),
    [overlay.marker, markerMetrics, markerTextFont],
  );

  if (isOffline && preparedTemplate !== tileTemplate) return null;
  return (
    <>
      <Images nativeAssetImages={[...ROUTE_MARKER_NATIVE_ASSET_IMAGES]} />
      <VectorSource key={tileTemplate} id="ghost-route-tiles" tileUrlTemplates={[tileTemplate]}>
        <FillLayer
          id="ghost-route-areas"
          sourceLayerID={miniMap.polyLineLayerId}
          slot={GHOST_ROUTE_SLOT}
          filter={POLYGON_FILTER}
          style={fillStyle}
        />
        <LineLayer
          id="ghost-route-lines"
          sourceLayerID={miniMap.polyLineLayerId}
          slot={GHOST_ROUTE_SLOT}
          filter={LINE_OR_POLYGON_FILTER}
          style={lineStyle}
        />
        <SymbolLayer
          id="ghost-route-point-labels"
          sourceLayerID={miniMap.pointLayerId}
          slot={GHOST_ROUTE_SLOT}
          filter={POINT_FILTER}
          style={labelStyle}
        />
        <SymbolLayer
          id="ghost-route-point-icons"
          sourceLayerID={miniMap.pointLayerId}
          slot={GHOST_ROUTE_SLOT}
          filter={POINT_FILTER}
          style={iconStyle}
        />
      </VectorSource>
    </>
  );
}

/**
 * A saved page's route drawn behind everything else on a trip report map, for navigating by while
 * recording. Uses the page's download when it has one, otherwise loads the page online. Draws
 * nothing for pages without a route map, or while the page can't be loaded.
 */
export function GhostRouteLayer({ savedPage }: { savedPage: SavedPage }) {
  const { isOnline } = useNetworkStatus();
  const pageId = savedPage.preview.id;
  const downloadedView = useDownloadedPageView(savedPage.downloadedPageViewPath);

  return (
    <RopeGeoDataLoader<RopewikiPageView>
      key={pageId}
      service={Service.WEBSCRAPER}
      method={Method.GET}
      onlinePath="/ropewiki/page/:id"
      onlinePathParams={{ id: pageId }}
      timeoutAfterSeconds={REQUEST_TIMEOUT_SECONDS}
      isOnline={isOnline}
      offlineData={downloadedView as unknown as RopewikiPageView | null | undefined}
    >
      {({ data }) => {
        const miniMap = data?.miniMap;
        if (miniMap == null || !isPageMiniMapType(miniMap.miniMapType)) return null;
        return <GhostRouteTiles miniMap={miniMap as OnlinePageMiniMap | OfflinePageMiniMap} />;
      }}
    </RopeGeoDataLoader>
  );
}
