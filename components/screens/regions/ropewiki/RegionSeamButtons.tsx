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

export type RegionSeamButtonsProps = {
  url: string | null;
  scrollY: SharedValue<number>;
  paddingTop: number;
  mapExpanded: boolean;
};

export function RegionSeamButtons({
  url,
  scrollY,
  paddingTop,
  mapExpanded,
}: RegionSeamButtonsProps) {
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

  if (url == null || mapExpanded) return null;

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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    height: SEAM_FLOAT_HEIGHT,
    justifyContent: "center",
    zIndex: 2001,
  },
});
