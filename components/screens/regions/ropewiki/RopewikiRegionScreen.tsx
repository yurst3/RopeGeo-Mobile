import { RegionBanner } from "./RegionBanner";
import { RegionContent } from "./RegionContent";
import {
  Method,
  RopeGeoHttpRequest,
  Service,
} from "@/components/RopeGeoHttpRequest";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STARTING_HEIGHT = Math.round(SCREEN_HEIGHT * 0.5);
const BANNER_HEIGHT_MAX = SCREEN_HEIGHT;
const FALLBACK_BANNER_ASPECT_RATIO = SCREEN_WIDTH / STARTING_HEIGHT;
const BACK_BUTTON_SIZE = 44;

/** Minimal shape for /ropewiki/region/:id response. */
type RopewikiRegionView = {
  name?: string;
  pageCount?: number;
  regionCount?: number;
  url?: string | null;
  [key: string]: unknown;
};

function formatCounts(pageCount: number, regionCount: number): string {
  if (regionCount === 0) {
    return `(${pageCount} ${pageCount === 1 ? "page" : "pages"})`;
  }
  const pages = `${pageCount} ${pageCount === 1 ? "page" : "pages"}`;
  const regions = `${regionCount} ${regionCount === 1 ? "region" : "regions"}`;
  return `(${pages} and ${regions})`;
}

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

  const name = data.name ?? "Region";
  const pageCount = data.pageCount ?? 0;
  const regionCount = data.regionCount ?? 0;
  const countsText = formatCounts(pageCount, regionCount);
  const url = data.url ?? null;

  return (
    <View style={styles.container}>
      <RegionBanner regionId={regionId} style={bannerAnimatedStyle} />

      <RegionContent
        regionId={regionId}
        name={name}
        countsText={countsText}
        url={url}
        insets={insets}
        scrollY={scrollY}
        paddingTop={paddingTop}
        onCardHeightLayout={setCardHeight}
      />

      <Pressable
        style={[styles.backButton, styles.backButtonFixed, { top: insets.top + 8 }]}
        onPress={() => router.back()}
        accessibilityLabel="Go back"
      >
        <FontAwesome5 name="arrow-left" size={20} color="#000" />
      </Pressable>
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
              <Pressable
                style={[styles.backButton, styles.backButtonFixed, { top: insets.top + 8 }]}
                onPress={() => router.back()}
                accessibilityLabel="Go back"
              >
                <FontAwesome5 name="arrow-left" size={20} color="#000" />
              </Pressable>
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
  backButton: {
    left: 16,
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    borderRadius: BACK_BUTTON_SIZE / 2,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  backButtonFixed: {
    position: "absolute",
    zIndex: 1001,
  },
});
