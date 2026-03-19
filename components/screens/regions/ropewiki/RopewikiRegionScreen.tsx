import { BackButton } from "@/components/buttons/BackButton";
import { RegionBanner } from "./RegionBanner";
import { RegionMiniMap } from "./RegionMiniMap";
import { RegionContent } from "./RegionContent";
import {
  RopeGeoHttpRequest,
  Service,
  Method,
} from "@/components/RopeGeoHttpRequest";

import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  StyleSheet,
  View,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { MiniMapType, PageDataSource, RopewikiRegionView } from "ropegeo-common";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STARTING_HEIGHT = Math.round(SCREEN_HEIGHT * 0.5);
const BANNER_HEIGHT_MAX = SCREEN_HEIGHT;
const FALLBACK_BANNER_ASPECT_RATIO = SCREEN_WIDTH / STARTING_HEIGHT;


function ErrorEffect({ error }: { error: Error }) {
  const router = useRouter();
  useEffect(() => {
    router.back();
    Toast.show({
      type: "error",
      text1: "Error",
      text2: error.message,
      position: "top",
      visibilityTime: 5000,
    });
  }, [error, router]);
  return null;
}

function RegionScreenBody({
  data,
  regionId,
}: {
  data: RopewikiRegionView;
  regionId: string;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useSharedValue(0);
  const aspectRatioSv = useSharedValue(FALLBACK_BANNER_ASPECT_RATIO);
  const startHeightSv = useSharedValue(STARTING_HEIGHT);
  const [cardHeight, setCardHeight] = useState<number | null>(null);
  const [mapMode, setMapMode] = useState<"collapsed" | "expanded">("collapsed");
  const [mountMiniMapNative, setMountMiniMapNative] = useState(false);
  const [miniMapAnchorRect, setMiniMapAnchorRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const baseScrollYRef = useRef(0);

  const hasMiniMap = data.miniMap != null;

  useEffect(() => {
    setMountMiniMapNative(false);
    setMiniMapAnchorRect(null);
  }, [regionId]);

  const handleMiniMapAnchorRect = useCallback(
    (rect: { x: number; y: number; width: number; height: number }) => {
      setMiniMapAnchorRect(rect);
      baseScrollYRef.current = scrollY.value;
    },
    [scrollY]
  );

  const handleMountMiniMapNative = useCallback(() => {
    setMountMiniMapNative(true);
  }, []);

  const openRegionFullMap = useCallback(() => {
    setMapMode("expanded");
  }, []);

  const closeRegionFullMap = useCallback(() => {
    setMapMode("collapsed");
  }, []);

  const bottomPadding = insets.bottom + 16;
  const paddingTop =
    cardHeight != null && cardHeight < SCREEN_HEIGHT / 2
      ? Math.max(0, SCREEN_HEIGHT - cardHeight - bottomPadding)
      : STARTING_HEIGHT;

  useEffect(() => {
    startHeightSv.value = Math.min(paddingTop, STARTING_HEIGHT);
  }, [paddingTop, startHeightSv]);

  const bannerAnimatedStyle = useAnimatedStyle(() => {
    const height = Math.max(
      Math.round(SCREEN_WIDTH / aspectRatioSv.value),
      Math.min(BANNER_HEIGHT_MAX, startHeightSv.value - scrollY.value)
    );
    const width = height * aspectRatioSv.value;
    return {
      height,
      width,
      left: (SCREEN_WIDTH - width) / 2,
    };
  });

  useEffect(() => {
    if (mapMode !== "expanded") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setMapMode("collapsed");
      return true;
    });
    return () => sub.remove();
  }, [mapMode]);

  return (
    <View style={styles.container}>
      <RegionBanner regionId={regionId} style={bannerAnimatedStyle} />

      <RegionContent
        regionId={regionId}
        region={data}
        insets={insets}
        scrollY={scrollY}
        paddingTop={paddingTop}
        onCardHeightLayout={setCardHeight}
        onOpenFullMap={openRegionFullMap}
        mapExpanded={mapMode === "expanded"}
        onMiniMapAnchorRect={handleMiniMapAnchorRect}
        onMountMiniMapNative={handleMountMiniMapNative}
      />

      {mapMode !== "expanded" && (
        <BackButton onPress={() => router.back()} top={insets.top + 8} />
      )}
      {hasMiniMap && data.miniMap?.miniMapType === MiniMapType.GeoJson ? (
        <RegionMiniMap
          regionName={data.name}
          regionId={regionId}
          source={PageDataSource.Ropewiki}
          mountNativeMap={mountMiniMapNative}
          expanded={mapMode === "expanded"}
          anchorRect={miniMapAnchorRect}
          baseScrollY={baseScrollYRef.current}
          scrollY={scrollY}
          onExpand={openRegionFullMap}
          onCollapse={closeRegionFullMap}
        />
      ) : null}
    </View>
  );
}

export type RopewikiRegionScreenProps = {
  regionId: string;
};

export function RopewikiRegionScreen({ regionId }: RopewikiRegionScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <RopeGeoHttpRequest<RopewikiRegionView>
      service={Service.WEBSCRAPER}
      method={Method.GET}
      path="/ropewiki/region/:id"
      pathParams={{ id: regionId }}
    >
      {({ loading, data, errors }) => {
        if (errors != null) {
          return <ErrorEffect error={errors} />;
        }
        if (loading) {
          return (
            <View style={styles.container}>
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#666" />
              </View>
              <BackButton onPress={() => router.back()} top={insets.top + 8} />
            </View>
          );
        }
        if (data == null) {
          return null;
        }
        return <RegionScreenBody data={data} regionId={regionId} />;
      }}
    </RopeGeoHttpRequest>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e5e7eb",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
});
