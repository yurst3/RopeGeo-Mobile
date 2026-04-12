import {
  RouteGeoJsonFeature,
  RoutesGeojson,
  RoutesParams,
} from "ropegeo-common/models";
import {
  Method,
  RopeGeoPaginationHttpRequest,
  Service,
} from "ropegeo-common/components";
import {
  Camera,
  Images,
  ShapeSource,
  SymbolLayer,
  type SymbolLayerStyle,
} from "@rnmapbox/maps";
import type { ComponentRef } from "react";
import { useEffect, useMemo, useRef } from "react";
import {
  ROUTE_MARKER_ICON_SIZE_INTERPOLATE,
  ROUTE_MARKER_IMAGES,
  unclusteredRouteMarkerIconImage,
  unclusteredRouteMarkerIconSize,
} from "./routeMarkerIcons";

export type RoutesState = {
  loading: boolean;
  data: RoutesGeojson | null;
  errors: Error | null;
  /** Items merged from completed pages so far. */
  received: number;
  /** Total from API when known; `null` until the first page returns. */
  total: number | null;
};

/** Exported for minimaps that render clustered route markers with the same layout as this layer. */
export const CLUSTER_RADIUS = 50;

type RouteMarkersLayerProps = {
  onStateChange?: (state: RoutesState) => void;
  cameraRef?: React.RefObject<ComponentRef<typeof Camera> | null>;
  onRoutePress?: (routeId: string, coordinates: [number, number]) => void;
  onRouteClusterPress?: () => void;
  /** Optional GET /routes query string params (e.g. region-scoped routes). */
  routesQueryParams?: Record<string, string | number | boolean | undefined>;
  /** Preferred: validated params object (global or region-scoped). */
  routesParams?: RoutesParams | null;
  /** Marker uses selected icon when this route id is focused (e.g. tap / preview). */
  focusedRouteId?: string | null;
  /** Marker uses selected icon for this id even without tap focus (e.g. page centered route). */
  accentRouteId?: string | null;
};

function RouteMarkersLayerContent({
  loading,
  data,
  errors,
  received,
  total,
  onStateChange,
  cameraRef,
  onRoutePress,
  onRouteClusterPress,
  focusedRouteId,
  accentRouteId,
}: RoutesState & {
  onStateChange?: (state: RoutesState) => void;
  cameraRef?: React.RefObject<ComponentRef<typeof Camera> | null>;
  onRoutePress?: (routeId: string, coordinates: [number, number]) => void;
  onRouteClusterPress?: () => void;
  focusedRouteId?: string | null;
  accentRouteId?: string | null;
}) {
  const shapeSourceRef = useRef<ComponentRef<typeof ShapeSource>>(null);

  const unclusteredIconImage = useMemo(
    () => unclusteredRouteMarkerIconImage(focusedRouteId, accentRouteId),
    [focusedRouteId, accentRouteId],
  );

  const unclusteredIconSize = useMemo(
    () => unclusteredRouteMarkerIconSize(focusedRouteId, accentRouteId),
    [focusedRouteId, accentRouteId],
  );

  useEffect(() => {
    onStateChange?.({ loading, data, errors, received, total });
  }, [loading, data, errors, received, total, onStateChange]);

  const handlePress = async (event: { features?: GeoJSON.Feature[] }) => {
    const features = event.features;
    if (!features?.length || !cameraRef?.current) {
      return;
    }
    const feature = features[0];
    const props = feature?.properties as {
      point_count?: number;
      id?: string;
    } | undefined;
    const geometry = feature?.geometry;
    if (geometry?.type !== "Point" || !Array.isArray(geometry.coordinates)) {
      return;
    }
    const coords = geometry.coordinates as [number, number];
    const [lng, lat] = coords;
    const isCluster = props?.point_count != null;

    if (isCluster && shapeSourceRef.current) {
      onRouteClusterPress?.();
      try {
        const zoom = await shapeSourceRef.current.getClusterExpansionZoom(
          feature as GeoJSON.Feature<GeoJSON.Point>,
        );
        cameraRef.current.setCamera({
          centerCoordinate: [lng, lat],
          zoomLevel: zoom,
          animationDuration: 300,
        });
      } catch {
        // getClusterExpansionZoom can fail on some platforms; ignore
      }
      return;
    }

    const routeId = props?.id;
    if (routeId) {
      onRoutePress?.(routeId, coords);
      cameraRef.current.setCamera({
        centerCoordinate: coords,
        animationDuration: 300,
      });
    }
  };

  if (data == null || data.features.length === 0) {
    return null;
  }

  const unclusteredStyle: SymbolLayerStyle = {
    iconImage: unclusteredIconImage,
    iconSize: unclusteredIconSize,
    iconAllowOverlap: true,
    iconIgnorePlacement: true,
    iconAnchor: "bottom",
    textField: ["get", "name"],
    textSize: 12,
    textColor: "#333333",
    textHaloColor: "#ffffff",
    textHaloWidth: 1.5,
    textOffset: [0, 0.2],
    textAnchor: "top",
    textAllowOverlap: true,
    textIgnorePlacement: true,
  };

  const clusterStyle: SymbolLayerStyle = {
    iconImage: "route-marker-cluster",
    iconSize: ROUTE_MARKER_ICON_SIZE_INTERPOLATE,
    iconAllowOverlap: true,
    iconIgnorePlacement: true,
    iconAnchor: "bottom",
    textField: [
      "concat",
      "(",
      ["to-string", ["get", "point_count"]],
      ")",
    ],
    textSize: 12,
    textColor: "#333333",
    textHaloColor: "#ffffff",
    textHaloWidth: 1.5,
    textOffset: [0, 0.2],
    textAnchor: "top",
    textAllowOverlap: true,
    textIgnorePlacement: true,
  };

  return (
    <ShapeSource
      ref={shapeSourceRef}
      id="routes-source"
      shape={data}
      cluster
      clusterRadius={CLUSTER_RADIUS}
      onPress={handlePress}
    >
      <SymbolLayer
        id="routes-symbol-layer-unclustered"
        filter={["!", ["has", "point_count"]]}
        style={unclusteredStyle}
      />
      <SymbolLayer
        id="routes-symbol-layer-clusters"
        filter={["has", "point_count"]}
        style={clusterStyle}
      />
      <Images images={{ ...ROUTE_MARKER_IMAGES }} />
    </ShapeSource>
  );
}

function queryRecordToRoutesParams(
  q: Record<string, string | number | boolean | undefined>,
): RoutesParams {
  const str: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(q)) {
    if (v !== undefined && v !== "") str[k] = String(v);
  }
  return RoutesParams.fromQueryStringParams(str);
}

/**
 * Route markers with client-side clustering. Fetches all pages of GET /routes via
 * {@link RopeGeoPaginationHttpRequest} and builds a single GeoJSON collection.
 */
export function RouteMarkersLayer({
  onStateChange,
  cameraRef,
  onRoutePress,
  onRouteClusterPress,
  routesQueryParams,
  routesParams,
  focusedRouteId = null,
  accentRouteId = null,
}: RouteMarkersLayerProps) {
  const paginationParams = useMemo((): RoutesParams => {
    if (routesParams != null) return routesParams;
    return queryRecordToRoutesParams(routesQueryParams ?? {});
  }, [routesParams, routesQueryParams]);

  return (
    <RopeGeoPaginationHttpRequest<RouteGeoJsonFeature>
      service={Service.WEBSCRAPER}
      method={Method.GET}
      path="/routes"
      queryParams={paginationParams}
    >
      {({ loading, data, errors, received, total }) => {
        const geojson =
          data != null ? new RoutesGeojson(data) : null;
        return (
          <RouteMarkersLayerContent
            loading={loading}
            data={geojson}
            errors={errors}
            received={received}
            total={total}
            onStateChange={onStateChange}
            cameraRef={cameraRef}
            onRoutePress={onRoutePress}
            onRouteClusterPress={onRouteClusterPress}
            focusedRouteId={focusedRouteId}
            accentRouteId={accentRouteId}
          />
        );
      }}
    </RopeGeoPaginationHttpRequest>
  );
}
