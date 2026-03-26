import { DownloadButton } from "@/components/buttons/DownloadButton";
import { ExternalLinkButton } from "@/components/buttons/ExternalLinkButton";
import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const CARD_BORDER_RADIUS = 24;
const SEAM_FLOAT_HEIGHT = 48;
/** How far above the card top the button wrapper sits (matches original `top: -64`). */
const SEAM_FLOAT_OFFSET = 64;

export type PageSeamButtonsProps = {
  url: string;
  scrollY: SharedValue<number>;
  paddingTop: number;
  mapExpanded: boolean;
  isDownloaded: boolean;
  downloading: boolean;
  downloadPhase: number;
  downloadPhaseProgress: number;
  onDownloadPress: () => void;
  onRemoveDownloadPress: () => void;
};

export function PageSeamButtons({
  url,
  scrollY,
  paddingTop,
  mapExpanded,
  isDownloaded,
  downloading,
  downloadPhase,
  downloadPhaseProgress,
  onDownloadPress,
  onRemoveDownloadPress,
}: PageSeamButtonsProps) {
  const paddingTopSv = useSharedValue(paddingTop);
  useEffect(() => {
    paddingTopSv.value = paddingTop;
  }, [paddingTop, paddingTopSv]);

  const animatedStyle = useAnimatedStyle(() => ({
    top:
      paddingTopSv.value -
      CARD_BORDER_RADIUS -
      SEAM_FLOAT_OFFSET -
      scrollY.value,
  }));

  if (mapExpanded) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrapper, animatedStyle]}
    >
      <ExternalLinkButton
        icon={require("@/assets/images/icons/ropewiki.png")}
        link={url}
        accessibilityLabel="Open on RopeWiki"
      />
      <DownloadButton
        isDownloaded={isDownloaded}
        downloading={downloading}
        downloadPhase={downloadPhase}
        downloadPhaseProgress={downloadPhaseProgress}
        onDownloadPress={onDownloadPress}
        onRemovePress={onRemoveDownloadPress}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    height: SEAM_FLOAT_HEIGHT,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 2001,
  },
});
