import { acceptWaypointFix } from "../acceptWaypointFix";

const SETTINGS = { intervalSeconds: 10, deadzoneMeters: 15, maxAccuracyMeters: 30 };
const ORIGIN = [-109.55, 38.57] as const;
/** About 22 m north of ORIGIN. */
const NORTH_22M = [-109.55, 38.5702] as const;
/** About 5.5 m north of ORIGIN. */
const NORTH_5M = [-109.55, 38.57005] as const;

describe("acceptWaypointFix", () => {
  const firstFix = (accuracyMeters: number | null) =>
    acceptWaypointFix(null, { waypoint: ORIGIN, timeMs: 0, accuracyMeters }, SETTINGS);

  it("keeps the first accurate fix of a segment", () => {
    expect(firstFix(5)).toBe(true);
  });

  it("rejects fixes less accurate than the max accuracy", () => {
    expect(firstFix(31)).toBe(false);
  });

  it("keeps fixes with unknown accuracy", () => {
    expect(firstFix(null)).toBe(true);
  });

  it("keeps any accuracy when there is no max accuracy", () => {
    const noLimit = { ...SETTINGS, maxAccuracyMeters: null };
    expect(
      acceptWaypointFix(null, { waypoint: ORIGIN, timeMs: 0, accuracyMeters: 500 }, noLimit),
    ).toBe(true);
  });

  it("requires the interval to elapse", () => {
    const last = { waypoint: ORIGIN, timeMs: 0 };
    expect(acceptWaypointFix(last, { waypoint: NORTH_22M, timeMs: 9_000 }, SETTINGS)).toBe(false);
    expect(acceptWaypointFix(last, { waypoint: NORTH_22M, timeMs: 10_000 }, SETTINGS)).toBe(true);
  });

  it("requires leaving the deadzone", () => {
    const last = { waypoint: ORIGIN, timeMs: 0 };
    expect(acceptWaypointFix(last, { waypoint: NORTH_5M, timeMs: 60_000 }, SETTINGS)).toBe(false);
  });

  it("only checks the deadzone when resuming without a last time", () => {
    const last = { waypoint: ORIGIN, timeMs: null };
    expect(acceptWaypointFix(last, { waypoint: NORTH_22M, timeMs: 1 }, SETTINGS)).toBe(true);
    expect(acceptWaypointFix(last, { waypoint: NORTH_5M, timeMs: 1 }, SETTINGS)).toBe(false);
  });
});
