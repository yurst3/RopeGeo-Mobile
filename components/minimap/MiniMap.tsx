import type { RoutesState } from "@/components/screens/explore/RouteMarkersLayer";
import { CenteredRegionMiniMapView } from "@/components/minimap/CenteredRegionMiniMapView";
import {
  PageMiniMapView,
  type PageMiniMapTileProps,
} from "@/components/minimap/PageMiniMapView";
import { MiniMapAnimatedCard } from "@/components/minimap/miniMapAnimatedCard";
import { PlaceholderMiniMap } from "@/components/minimap/PlaceholderMiniMap";
import { RegionMiniMapView } from "@/components/minimap/RegionMiniMapView";
import { minimapStyles } from "@/components/minimap/shared/minimapShared";
import { miniMapHostStyles } from "@/components/minimap/shared/miniMapHostStyles";
import { type Rect } from "@/components/minimap/shared/useMiniMapAnimation";
import { forwardRef, useImperativeHandle, useRef } from "react";
import type { MiniMapHandle, MiniMapReloadRegisterRef } from "@/components/minimap/miniMapHandle";
import type { SharedValue } from "react-native-reanimated";
import { View } from "react-native";
import {
  MiniMapType,
  PageDataSource,
  type OfflineCenteredRegionMiniMap,
  type OnlineCenteredRegionMiniMap,
  type OnlineRegionMiniMap,
} from "ropegeo-common/models";

type MiniMapShellProps = {
  mountNativeMap: boolean;
  expanded: boolean;
  anchorRect: Rect | null;
  baseScrollY: number;
  scrollY: SharedValue<number>;
  onExpand: () => void;
  onCollapse: () => void;
};

export type MiniMapProps = MiniMapShellProps &
  (
    | {
        miniMap: PageMiniMapTileProps;
        mapDirections?: { lat: number; lon: number } | null;
      }
    | {
        miniMap: OnlineRegionMiniMap;
        regionId: string;
        source: PageDataSource;
        onRoutesStateChange?: (state: RoutesState) => void;
      }
    | {
        miniMap: OnlineCenteredRegionMiniMap | OfflineCenteredRegionMiniMap;
        mapDirections?: { lat: number; lon: number } | null;
      }
  );

export type { MiniMapHandle, MiniMapReloadRegisterRef } from "@/components/minimap/miniMapHandle";

/**
 * Dispatches to the correct minimap implementation from {@link MiniMapType} and forwards shell props.
 */
export const MiniMap = forwardRef<MiniMapHandle, MiniMapProps>(function MiniMap(props, ref) {
  const {
    miniMap,
    mountNativeMap,
    expanded,
    anchorRect,
    baseScrollY,
    scrollY,
    onExpand,
    onCollapse,
  } = props;

  const reloadRegisterRef: MiniMapReloadRegisterRef = useRef<(() => void) | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      reload: () => {
        reloadRegisterRef.current?.();
      },
    }),
    [],
  );

  const cardProps = {
    mountNativeMap,
    expanded,
    anchorRect,
    baseScrollY,
    scrollY,
    onExpand,
    onCollapse,
  };

  switch (miniMap.miniMapType) {
    case MiniMapType.Region: {
      const p = props as Extract<MiniMapProps, { miniMap: OnlineRegionMiniMap }>;
      return (
        <MiniMapAnimatedCard {...cardProps}>
          <RegionMiniMapView
            regionMiniMap={p.miniMap}
            regionId={p.regionId}
            source={p.source}
            onRoutesStateChange={p.onRoutesStateChange}
            onCollapse={onCollapse}
            reloadRegisterRef={reloadRegisterRef}
          />
        </MiniMapAnimatedCard>
      );
    }
    case MiniMapType.CenteredRegion: {
      const p = props as Extract<
        MiniMapProps,
        { miniMap: OnlineCenteredRegionMiniMap | OfflineCenteredRegionMiniMap }
      >;
      return (
        <MiniMapAnimatedCard {...cardProps} mapDirections={p.mapDirections}>
          <CenteredRegionMiniMapView
            miniMap={p.miniMap}
            onCollapse={onCollapse}
            reloadRegisterRef={reloadRegisterRef}
          />
        </MiniMapAnimatedCard>
      );
    }
    case MiniMapType.Page: {
      const p = props as Extract<MiniMapProps, { miniMap: PageMiniMapTileProps }>;
      return (
        <MiniMapAnimatedCard {...cardProps} mapDirections={p.mapDirections}>
          <PageMiniMapView
            miniMap={p.miniMap}
            onCollapse={onCollapse}
            reloadRegisterRef={reloadRegisterRef}
          />
        </MiniMapAnimatedCard>
      );
    }
    default: {
      if (!anchorRect) return null;
      return (
        <View style={miniMapHostStyles.root} pointerEvents="box-none">
          <View style={minimapStyles.wrapper}>
            <PlaceholderMiniMap errorMessage="Unsupported miniMapType value" />
          </View>
        </View>
      );
    }
  }
});
