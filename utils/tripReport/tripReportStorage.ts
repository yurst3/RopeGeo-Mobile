import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { useEffect, useState } from "react";
import {
  TripReport,
  TripReportDraft,
  type TripReportDraftJson,
  type TripReportJson,
} from "ropegeo-common/models";

/** AsyncStorage key for draft summaries: report id → {@link TripReportDraftJson}. */
const DRAFTS_STORAGE_KEY = "ropegeo:tripReportDrafts";

type DraftsStorageMap = Record<string, TripReportDraftJson>;

function tripReportDirUri(reportId: string): string {
  const base = FileSystem.documentDirectory;
  if (base == null) {
    throw new Error("documentDirectory is not available");
  }
  const trimmed = base.endsWith("/") ? base : `${base}/`;
  return `${trimmed}ropegeo/tripReports/${reportId}/`;
}

function tripReportFileUri(reportId: string): string {
  return `${tripReportDirUri(reportId)}report.json`;
}

function tripReportTempFileUri(reportId: string): string {
  return `${tripReportDirUri(reportId)}report.json.tmp`;
}

const draftListeners = new Set<() => void>();

function notifyDraftsChanged(): void {
  for (const listener of draftListeners) listener();
}

/** Writes run one at a time so overlapping autosaves can't interleave file or index updates. */
let writeQueue: Promise<void> = Promise.resolve();

function enqueueWrite(task: () => Promise<void>): Promise<void> {
  const run = writeQueue.then(task);
  writeQueue = run.catch(() => {});
  return run;
}

async function loadDraftsMap(): Promise<DraftsStorageMap> {
  const raw = await AsyncStorage.getItem(DRAFTS_STORAGE_KEY);
  if (raw == null || raw === "") return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed != null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as DraftsStorageMap)
      : {};
  } catch {
    return {};
  }
}

/** Draft summaries for the profile's Trip Reports tab, most recently edited first. */
export async function loadTripReportDrafts(): Promise<TripReportDraft[]> {
  const map = await loadDraftsMap();
  const drafts: TripReportDraft[] = [];
  for (const json of Object.values(map)) {
    try {
      drafts.push(TripReportDraft.fromJSON(json));
    } catch (error) {
      console.warn("[TripReportStorage] skipped invalid draft", error);
    }
  }
  return drafts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

/** Must run inside {@link enqueueWrite}. */
async function writeTripReport(report: TripReport, json: string, draft: TripReportDraft) {
  const fileUri = tripReportFileUri(report.id);
  const tempUri = tripReportTempFileUri(report.id);
  await FileSystem.makeDirectoryAsync(tripReportDirUri(report.id), { intermediates: true });
  await FileSystem.writeAsStringAsync(tempUri, json);
  await FileSystem.deleteAsync(fileUri, { idempotent: true });
  await FileSystem.moveAsync({ from: tempUri, to: fileUri });

  const map = await loadDraftsMap();
  map[report.id] = draft.toJSON();
  await AsyncStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(map));
  notifyDraftsChanged();
}

/**
 * Saves the full report to its own file (written to a temp file, then moved into place) and
 * updates its draft summary in AsyncStorage.
 */
export function saveTripReport(report: TripReport): Promise<void> {
  const json = JSON.stringify(report.toJSON());
  const draft = TripReportDraft.fromTripReport(report);
  return enqueueWrite(() => writeTripReport(report, json, draft));
}

/** Deletes the report's folder and its draft summary. Runs after any pending saves. */
export function deleteTripReport(reportId: string): Promise<void> {
  return enqueueWrite(async () => {
    await FileSystem.deleteAsync(tripReportDirUri(reportId), { idempotent: true });
    const map = await loadDraftsMap();
    if (reportId in map) {
      delete map[reportId];
      await AsyncStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(map));
    }
    notifyDraftsChanged();
  });
}

/** Falls back to the temp file if a save was interrupted between writing it and moving it into place. */
async function readTripReport(reportId: string): Promise<TripReport> {
  for (const uri of [tripReportFileUri(reportId), tripReportTempFileUri(reportId)]) {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) continue;
    const raw = await FileSystem.readAsStringAsync(uri);
    return TripReport.fromJSON(JSON.parse(raw) as TripReportJson);
  }
  throw new Error(`No saved trip report with id ${reportId}`);
}

/** Loads a saved report once any pending saves have finished. */
export async function loadTripReport(reportId: string): Promise<TripReport> {
  await writeQueue;
  return readTripReport(reportId);
}

/**
 * Loads, updates, and saves a report as one queued write, so no other save can land in between.
 * Throws if the report isn't saved or `update` throws.
 */
export function updateSavedTripReport(
  reportId: string,
  update: (report: TripReport) => TripReport,
): Promise<void> {
  return enqueueWrite(async () => {
    const report = update(await readTripReport(reportId));
    await writeTripReport(
      report,
      JSON.stringify(report.toJSON()),
      TripReportDraft.fromTripReport(report),
    );
  });
}

/** Draft summaries, reloaded whenever a report is saved. */
export function useTripReportDrafts(): TripReportDraft[] {
  const [drafts, setDrafts] = useState<TripReportDraft[]>([]);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void loadTripReportDrafts()
        .then((next) => {
          if (!cancelled) setDrafts(next);
        })
        .catch((error) => console.warn("[TripReportStorage] load drafts failed", error));
    };
    refresh();
    draftListeners.add(refresh);
    return () => {
      cancelled = true;
      draftListeners.delete(refresh);
    };
  }, []);

  return drafts;
}
