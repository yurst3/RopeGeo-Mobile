import {
  RouteGeoJsonFeature,
  RoutesGeojson,
  RoutesParams,
} from "ropegeo-common/classes";
import {
  Method,
  RopeGeoPaginationHttpRequest,
  Service,
} from "ropegeo-common/components";
import { Camera, Images, ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import type { ComponentRef } from "react";
import { useEffect, useMemo, useRef } from "react";

export type RoutesState = {
  loading: boolean;
  data: RoutesGeojson | null;
  errors: Error | null;
  /** Items merged from completed pages so far. */
  received: number;
  /** Total from API when known; `null` until the first page returns. */
  total: number | null;
};

/**
 * Route marker icon size (constant screen size at all zoom levels).
 * The zoom-22 value must be (ICON_SIZE_AT_ZOOM_0 * 2^-22) so the icon doesn't scale with zoom.
 */
const ROUTE_ICON_SIZE_AT_ZOOM_0 = 0.05;
const ROUTE_ICON_SIZE_AT_ZOOM_22 = ROUTE_ICON_SIZE_AT_ZOOM_0 * 2 ** -22;

const CLUSTER_RADIUS = 50;

type RouteMarkersLayerProps = {
  onStateChange?: (state: RoutesState) => void;
  cameraRef?: React.RefObject<ComponentRef<typeof Camera> | null>;
  onRoutePress?: (routeId: string, coordinates: [number, number]) => void;
  onRouteClusterPress?: () => void;
  /** Optional GET /routes query string params (e.g. region-scoped routes). */
  routesQueryParams?: Record<string, string | number | boolean | undefined>;
  /** Preferred: validated params object (global or region-scoped). */
  routesParams?: RoutesParams | null;
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
}: RoutesState & {
  onStateChange?: (state: RoutesState) => void;
  cameraRef?: React.RefObject<ComponentRef<typeof Camera> | null>;
  onRoutePress?: (routeId: string, coordinates: [number, number]) => void;
  onRouteClusterPress?: () => void;
}) {
  const shapeSourceRef = useRef<ComponentRef<typeof ShapeSource>>(null);

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
        style={{
          iconImage: "map-marker",
          iconSize: [
            "interpolate",
            ["exponential", 2],
            ["zoom"],
            0,
            ROUTE_ICON_SIZE_AT_ZOOM_0,
            22,
            ROUTE_ICON_SIZE_AT_ZOOM_22,
          ],
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
        }}
      />
      <SymbolLayer
        id="routes-symbol-layer-clusters"
        filter={["has", "point_count"]}
        style={{
          iconImage: "map-marker",
          iconSize: [
            "interpolate",
            ["exponential", 2],
            ["zoom"],
            0,
            ROUTE_ICON_SIZE_AT_ZOOM_0,
            22,
            ROUTE_ICON_SIZE_AT_ZOOM_22,
          ],
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
        }}
      />
      <Images
        images={{
          "map-marker": require("@/assets/images/icons/location-dot-solid.png"),
        }}
      />
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
          />
        );
      }}
    </RopeGeoPaginationHttpRequest>
  );
}
