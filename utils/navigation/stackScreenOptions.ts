import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";

/** Shared stack defaults: back only via explicit controls, not swipe gestures. */
export const stackScreenOptions: NativeStackNavigationOptions = {
  gestureEnabled: false,
  fullScreenGestureEnabled: false,
};
