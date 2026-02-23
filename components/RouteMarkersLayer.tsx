import {
  Method,
  RopeGeoHttpRequest,
  Service,
} from "@/components/RopeGeoHttpRequest";
import { Camera, Images, ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import type { ComponentRef } from "react";
import { useEffect, useRef } from "react";

/**
 * GeoJSON FeatureCollection returned by GET /routes.
 * Matches the API docs: https://api.webscraper.ropegeo.com/docs/index.html#tag/routes/operation/getRoutes
 */
export type RoutesGeoJSON = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: "Point";
      coordinates: [number, number];
    };
    properties: {
      id: string;
      name: string;
      type: string;
    };
  }>;
};

export type RoutesState = {
  loading: boolean;
  data: RoutesGeoJSON | null;
  errors: Error | null;
};

/**
 * Route marker icon size (constant screen size at all zoom levels).
 * - Lower value = smaller markers (e.g. 0.08, 0.1).
 * - Higher value = larger markers (e.g. 0.25, 0.3).
 * The zoom-22 value must be (ICON_SIZE_AT_ZOOM_0 * 2^-22) so the icon doesn't scale with zoom.
 */
const ROUTE_ICON_SIZE_AT_ZOOM_0 = 0.05;
const ROUTE_ICON_SIZE_AT_ZOOM_22 = ROUTE_ICON_SIZE_AT_ZOOM_0 * 2 ** -22;

type RouteMarkersLayerProps = {
  /** Called when loading, data, or errors change so the parent can sync state (e.g. for toasts and loading indicator). */
  onStateChange?: (state: RoutesState) => void;
  /** Ref to the map Camera so the layer can expand a cluster on tap (zoom to show all markers in the cluster). */
  cameraRef?: React.RefObject<ComponentRef<typeof Camera> | null>;
  /** Called when the user taps an unclustered route marker. Receives the route id and the marker coordinates [lng, lat]. */
  onRoutePress?: (routeId: string, coordinates: [number, number]) => void;
  /** Called when the user taps a route cluster (before expanding the cluster). Use e.g. to clear focused route and stop follow mode. */
  onRouteClusterPress?: () => void;
};

function RouteMarkersLayerContent({
  loading,
  data,
  errors,
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
    onStateChange?.({ loading, data, errors });
  }, [loading, data, errors, onStateChange]);

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
          feature as GeoJSON.Feature<GeoJSON.Point>
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

    // Single route marker pressed
    const routeId = props?.id;
    if (routeId) {
      onRoutePress?.(routeId, coords);
      cameraRef.current.setCamera({
        centerCoordinate: [lng, lat],
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
      clusterRadius={50}
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
          iconAnchor: "bottom",
          textField: ["get", "name"],
          textSize: 12,
          textColor: "#333333",
          textHaloColor: "#ffffff",
          textHaloWidth: 1.5,
          textOffset: [0, 0.2],
          textAnchor: "top",
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
        }}
      />
      <Images
        images={{
          "map-marker": require("@/assets/images/location-dot-solid.png"),
        }}
      />
    </ShapeSource>
  );
}

export function RouteMarkersLayer({
  onStateChange,
  cameraRef,
  onRoutePress,
  onRouteClusterPress,
}: RouteMarkersLayerProps) {
  return (
    <RopeGeoHttpRequest<RoutesGeoJSON>
      service={Service.WEBSCRAPER}
      method={Method.GET}
      path="/routes"
    >
      {({ loading, data, errors }) => (
        <RouteMarkersLayerContent
          loading={loading}
          data={data}
          errors={errors}
          onStateChange={onStateChange}
          cameraRef={cameraRef}
          onRoutePress={onRoutePress}
          onRouteClusterPress={onRouteClusterPress}
        />
      )}
    </RopeGeoHttpRequest>
  );
}
