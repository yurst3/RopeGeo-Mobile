import type { MapView } from "@rnmapbox/maps";
import type { ComponentRef } from "react";
import type { TripReportWaypoint } from "ropegeo-common/models";

type ScreenPoint = [x: number, y: number];

/** Farthest (in points) a converted map position may land from the screen point it came from. */
const CONVERSION_TOLERANCE = 0.5;
/** Position step, in degrees (about a meter), for measuring how the screen point changes. */
const NEWTON_STEP = 1e-5;
const NEWTON_MAX_ITERATIONS = 5;

/**
 * The map position under `screenPoint`. With the style's 3D terrain, Mapbox's screen-to-map
 * conversion sometimes returns a position far (up to hundreds of points) from the screen point,
 * while its map-to-screen conversion always matches where markers are drawn. So the result is
 * checked by converting it back, and when it misses, the position is solved for with map-to-screen
 * conversions alone: Newton's method, starting from `guess`.
 */
export async function mapPositionAt(
  map: ComponentRef<typeof MapView>,
  screenPoint: ScreenPoint,
  guess: TripReportWaypoint,
): Promise<TripReportWaypoint> {
  const [x, y] = screenPoint;
  const converted = await map.getCoordinateFromView(screenPoint);
  const back = await map.getPointInView(converted);
  if (Math.hypot(back[0] - x, back[1] - y) <= CONVERSION_TOLERANCE) {
    return [converted[0], converted[1]];
  }
  let [lng, lat] = guess;
  for (let iteration = 0; iteration < NEWTON_MAX_ITERATIONS; iteration++) {
    const [at, lngStepped, latStepped] = await Promise.all([
      map.getPointInView([lng, lat]),
      map.getPointInView([lng + NEWTON_STEP, lat]),
      map.getPointInView([lng, lat + NEWTON_STEP]),
    ]);
    const errorX = x - at[0];
    const errorY = y - at[1];
    if (Math.hypot(errorX, errorY) <= CONVERSION_TOLERANCE) break;
    // How the screen point moves per degree of longitude (a, c) and of latitude (b, d).
    const a = (lngStepped[0] - at[0]) / NEWTON_STEP;
    const c = (lngStepped[1] - at[1]) / NEWTON_STEP;
    const b = (latStepped[0] - at[0]) / NEWTON_STEP;
    const d = (latStepped[1] - at[1]) / NEWTON_STEP;
    const determinant = a * d - b * c;
    if (determinant === 0) break;
    lng += (d * errorX - b * errorY) / determinant;
    lat += (a * errorY - c * errorX) / determinant;
  }
  return [lng, lat];
}
