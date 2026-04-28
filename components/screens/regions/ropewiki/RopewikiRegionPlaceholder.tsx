import { BackButton } from "@/components/buttons/BackButton";
import { PlaceholderMiniMap } from "@/components/minimap/PlaceholderMiniMap";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";
import { PageDataSource } from "ropegeo-common/models";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HALF_HEIGHT = SCREEN_HEIGHT / 2;
const CARD_BORDER_RADIUS = 24;
/** Matches {@link RegionSeamButtons} seam positioning. */
const SEAM_FLOAT_OFFSET = 64;
const EXTERNAL_LINK_SIZE = 48;
const EXTERNAL_LINK_ICON = 28;

export type RopewikiRegionPlaceholderProps = {
  backTop: number;
  source: PageDataSource;
  /** When set, banner shows `missingImage` and this text instead of loading spinners. */
  errorMessage?: string;
  /** Back button + Android hardware back; defaults to `router.back()`. */
  onBackPress?: () => void;
};

function iconForSource(source: PageDataSource): ImageSourcePropType {
  switch (source) {
    case PageDataSource.Ropewiki:
      return require("@/assets/images/icons/ropewiki.png");
    default:
      return require("@/assets/images/icons/ropewiki.png");
  }
}

/**
 * Loading / offline / error shell matching loaded region layout: ~50% banner, overlapping card.
 * Non-interactive external-link control at the same seam position as {@link RegionSeamButtons}.
 */
export function RopewikiRegionPlaceholder({
  backTop,
  source,
  errorMessage,
  onBackPress,
}: RopewikiRegionPlaceholderProps) {
  const router = useRouter();
  const isError = errorMessage != null && errorMessage !== "";
  const handleBack = useCallback(() => {
    if (onBackPress != null) {
      onBackPress();
    } else {
      router.back();
    }
  }, [onBackPress, router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [handleBack]);
  const paddingTop = HALF_HEIGHT;
  const seamTop =
    paddingTop - CARD_BORDER_RADIUS - SEAM_FLOAT_OFFSET;

  return (
    <View style={styles.container}>
      <View style={[styles.banner, { height: HALF_HEIGHT }]}>
        {isError ? (
          <>
            <Image
              source={require("@/assets/images/icons/missingImage.png")}
              style={styles.missingImage}
              contentFit="contain"
            />
            <Text style={styles.errorTitle}>{errorMessage}</Text>
          </>
        ) : (
          <ActivityIndicator size="large" color="#666" />
        )}
      </View>

      <View style={[styles.card, { marginTop: -CARD_BORDER_RADIUS }]}>
        <View style={styles.titleBar} />
        <View style={[styles.line, { width: "55%" }]} />
        <View style={[styles.line, { width: "40%" }]} />
        <View style={styles.miniMapWrap}>
          <PlaceholderMiniMap
            errorMessage={
              isError ? "Could not load map data" : undefined
            }
          />
        </View>
      </View>

      <View
        pointerEvents="none"
        style={[styles.seamLinkWrap, { top: seamTop }]}
        accessibilityElementsHidden
      >
        <View style={styles.seamLinkCircle}>
          <Image
            source={iconForSource(source)}
            style={styles.seamLinkIcon}
            contentFit="contain"
          />
        </View>
      </View>

      <BackButton onPress={handleBack} top={backTop} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e5e7eb",
  },
  banner: {
    width: SCREEN_WIDTH,
    backgroundColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  missingImage: {
    width: 56,
    height: 56,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#dc2626",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: CARD_BORDER_RADIUS,
    borderTopRightRadius: CARD_BORDER_RADIUS,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  titleBar: {
    height: 22,
    width: "72%",
    borderRadius: 6,
    backgroundColor: "#e5e7eb",
  },
  line: {
    height: 12,
    borderRadius: 4,
    backgroundColor: "#e5e7eb",
  },
  miniMapWrap: {
    marginTop: 16,
  },
  seamLinkWrap: {
    position: "absolute",
    left: 16,
    height: EXTERNAL_LINK_SIZE,
    justifyContent: "center",
    zIndex: 2001,
  },
  seamLinkCircle: {
    width: EXTERNAL_LINK_SIZE,
    height: EXTERNAL_LINK_SIZE,
    borderRadius: EXTERNAL_LINK_SIZE / 2,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  seamLinkIcon: {
    width: EXTERNAL_LINK_ICON,
    height: EXTERNAL_LINK_ICON,
  },
});
