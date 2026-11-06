import type { LengthMeasurementSystem } from "ropegeo-common/models";

/** Global settings that decide when a recording keeps a new waypoint. */
export type WaypointRecordingSettings = {
  /** Minimum time between waypoints. Always one of {@link WAYPOINT_INTERVAL_STEPS_SECONDS}. */
  intervalSeconds: number;
  /** Minimum distance from the previous waypoint. */
  deadzoneMeters: number;
  /**
   * Location fixes reporting worse accuracy than this are skipped. Null means no limit: every
   * fix can become a waypoint.
   */
  maxAccuracyMeters: number | null;
};

export const DEFAULT_WAYPOINT_RECORDING: WaypointRecordingSettings = {
  intervalSeconds: 60,
  deadzoneMeters: 15,
  maxAccuracyMeters: null,
};

/** Selectable intervals: every 5 seconds up to 1 minute, then every minute up to 10 minutes. */
export const WAYPOINT_INTERVAL_STEPS_SECONDS: readonly number[] = [
  ...Array.from({ length: 12 }, (_, i) => (i + 1) * 5),
  ...Array.from({ length: 9 }, (_, i) => (i + 2) * 60),
];

export const WAYPOINT_RECORDING_LIMITS: Record<
  keyof WaypointRecordingSettings,
  { min: number; max: number }
> = {
  intervalSeconds: {
    min: WAYPOINT_INTERVAL_STEPS_SECONDS[0],
    max: WAYPOINT_INTERVAL_STEPS_SECONDS[WAYPOINT_INTERVAL_STEPS_SECONDS.length - 1],
  },
  deadzoneMeters: { min: 0, max: 100 },
  /** Finite limits; above the max the setting is null (no limit). */
  maxAccuracyMeters: { min: 5, max: 100 },
};

function clamp(value: number, { min, max }: { min: number; max: number }): number {
  return Math.min(max, Math.max(min, value));
}

/** Index of the selectable interval closest to `seconds`. */
export function nearestWaypointIntervalIndex(seconds: number): number {
  let best = 0;
  WAYPOINT_INTERVAL_STEPS_SECONDS.forEach((step, index) => {
    if (Math.abs(step - seconds) < Math.abs(WAYPOINT_INTERVAL_STEPS_SECONDS[best] - seconds)) {
      best = index;
    }
  });
  return best;
}

/** e.g. "5 sec", "45 sec", "1 min", "10 min". */
export function formatWaypointInterval(seconds: number): string {
  return seconds < 60 ? `${seconds} sec` : `${Math.round(seconds / 60)} min`;
}

/*
 * Distance settings move in length steps of 5 m (metric) or 15 ft (imperial / freedom), up to
 * 20 steps: 100 m or 300 ft.
 */
const METERS_PER_FOOT = 0.3048;
const LENGTH_STEP_METERS = 5;
const LENGTH_STEP_FEET = 15;
const MAX_LENGTH_STEPS = 20;

function usesFeet(units: LengthMeasurementSystem): boolean {
  return units !== "Metric";
}

function lengthStepsToMeters(steps: number, units: LengthMeasurementSystem): number {
  const meters = usesFeet(units)
    ? steps * LENGTH_STEP_FEET * METERS_PER_FOOT
    : steps * LENGTH_STEP_METERS;
  return Math.round(meters * 1000) / 1000;
}

function nearestLengthSteps(meters: number, units: LengthMeasurementSystem): number {
  const steps = usesFeet(units)
    ? meters / METERS_PER_FOOT / LENGTH_STEP_FEET
    : meters / LENGTH_STEP_METERS;
  return Math.max(0, Math.min(MAX_LENGTH_STEPS, Math.round(steps)));
}

function formatLengthSteps(steps: number, units: LengthMeasurementSystem): string {
  return usesFeet(units)
    ? `${steps * LENGTH_STEP_FEET} ft`
    : `${steps * LENGTH_STEP_METERS} m`;
}

/** Deadzone stops: 0–100 m by 5 m, or 0–300 ft by 15 ft. */
export const WAYPOINT_DEADZONE_STEP_COUNT = MAX_LENGTH_STEPS + 1;

/** Meters stored for deadzone stop `index` in the given units. */
export function waypointDeadzoneStepMeters(
  index: number,
  units: LengthMeasurementSystem,
): number {
  return lengthStepsToMeters(index, units);
}

/** Index of the deadzone stop closest to `meters` in the given units. */
export function nearestWaypointDeadzoneIndex(
  meters: number,
  units: LengthMeasurementSystem,
): number {
  return nearestLengthSteps(meters, units);
}

/** e.g. "15 m" or "45 ft". */
export function formatWaypointDeadzoneStep(
  index: number,
  units: LengthMeasurementSystem,
): string {
  return formatLengthSteps(index, units);
}

/** Max accuracy stops: 5–100 m by 5 m (or 15–300 ft by 15 ft), then a last "no limit" stop. */
export const WAYPOINT_MAX_ACCURACY_STEP_COUNT = MAX_LENGTH_STEPS + 1;
const NO_ACCURACY_LIMIT_INDEX = WAYPOINT_MAX_ACCURACY_STEP_COUNT - 1;

/** Meters stored for max accuracy stop `index`, or null for the "no limit" stop. */
export function waypointMaxAccuracyStepMeters(
  index: number,
  units: LengthMeasurementSystem,
): number | null {
  return index >= NO_ACCURACY_LIMIT_INDEX ? null : lengthStepsToMeters(index + 1, units);
}

/** Index of the max accuracy stop closest to `meters` (null is the "no limit" stop). */
export function nearestWaypointMaxAccuracyIndex(
  meters: number | null,
  units: LengthMeasurementSystem,
): number {
  if (meters == null) return NO_ACCURACY_LIMIT_INDEX;
  return Math.max(0, Math.min(NO_ACCURACY_LIMIT_INDEX - 1, nearestLengthSteps(meters, units) - 1));
}

/** e.g. "30 m", "90 ft", or "∞" for no limit. */
export function formatWaypointMaxAccuracyStep(
  index: number,
  units: LengthMeasurementSystem,
): string {
  return index >= NO_ACCURACY_LIMIT_INDEX ? "∞" : formatLengthSteps(index + 1, units);
}

/**
 * Clamps every value to its limits and snaps the interval to a selectable step; missing or
 * non-finite values fall back to the defaults. A null max accuracy (no limit) is kept.
 */
export function normalizeWaypointRecording(
  values: Partial<WaypointRecordingSettings>,
): WaypointRecordingSettings {
  const pick = (key: "intervalSeconds" | "deadzoneMeters"): number => {
    const value = values[key];
    return typeof value === "number" && Number.isFinite(value)
      ? clamp(value, WAYPOINT_RECORDING_LIMITS[key])
      : DEFAULT_WAYPOINT_RECORDING[key];
  };
  const maxAccuracy = values.maxAccuracyMeters;
  return {
    intervalSeconds:
      WAYPOINT_INTERVAL_STEPS_SECONDS[nearestWaypointIntervalIndex(pick("intervalSeconds"))],
    deadzoneMeters: pick("deadzoneMeters"),
    maxAccuracyMeters:
      maxAccuracy === null
        ? null
        : typeof maxAccuracy === "number" && Number.isFinite(maxAccuracy)
          ? clamp(maxAccuracy, WAYPOINT_RECORDING_LIMITS.maxAccuracyMeters)
          : DEFAULT_WAYPOINT_RECORDING.maxAccuracyMeters,
  };
}
