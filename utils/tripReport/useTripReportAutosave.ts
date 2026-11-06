import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import type { TripReport } from "ropegeo-common/models";
import { saveTripReport } from "./tripReportStorage";

/** Wait after the last change before saving, so typing or streaming waypoints batch up. */
const AUTOSAVE_DELAY_MS = 1000;

/**
 * Saves `report` shortly after it stops changing, and immediately when the app leaves the
 * foreground or the screen unmounts. `savedReport` is the version already on disk (null for a
 * new report, which is then saved right away so it shows up as a draft).
 *
 * Versions with validation errors are never saved, so leaving the screen mid-error keeps the
 * last valid version on disk and reopening the draft shows that version.
 *
 * `withPendingEdits` folds in edits the screen hasn't committed to `report` yet (e.g. a title
 * still being typed), so leaving the screen mid-edit doesn't lose them. It must return the same
 * report when there's nothing pending.
 *
 * Returns `stopAutosave`, which turns saving off for good (e.g. before deleting the report, so
 * the save on unmount can't bring it back).
 */
export function useTripReportAutosave(
  report: TripReport,
  savedReport: TripReport | null,
  withPendingEdits?: (report: TripReport) => TripReport,
): { stopAutosave: () => void } {
  const latestRef = useRef(report);
  latestRef.current = report;
  const withPendingEditsRef = useRef(withPendingEdits);
  withPendingEditsRef.current = withPendingEdits;
  const lastSavedRef = useRef<TripReport | null>(savedReport);
  const stoppedRef = useRef(false);

  const flush = useCallback(() => {
    const latest = latestRef.current;
    const next = withPendingEditsRef.current?.(latest) ?? latest;
    if (stoppedRef.current || next === lastSavedRef.current || !next.isValid) return;
    lastSavedRef.current = next;
    saveTripReport(next).catch((error) => {
      console.warn("[TripReportAutosave] save failed", error);
    });
  }, []);

  useEffect(() => {
    if (report === lastSavedRef.current || !report.isValid) return;
    const delay = lastSavedRef.current == null ? 0 : AUTOSAVE_DELAY_MS;
    const timer = setTimeout(flush, delay);
    return () => clearTimeout(timer);
  }, [report, flush]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") flush();
    });
    return () => {
      subscription.remove();
      flush();
    };
  }, [flush]);

  const stopAutosave = useCallback(() => {
    stoppedRef.current = true;
  }, []);

  return { stopAutosave };
}
