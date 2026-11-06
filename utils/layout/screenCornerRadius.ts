/**
 * Corner radius of the device's display in points; 0 on square screens or when unknown.
 * The library reads its native module at import time and throws if it isn't linked, so a
 * missing module falls back to square corners instead of crashing.
 */
export const SCREEN_CORNER_RADIUS: number = (() => {
  try {
    const { ScreenCornerRadius } =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("react-native-screen-corner-radius") as typeof import("react-native-screen-corner-radius");
    return Number.isFinite(ScreenCornerRadius) ? ScreenCornerRadius : 0;
  } catch {
    return 0;
  }
})();
