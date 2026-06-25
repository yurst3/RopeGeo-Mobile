import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DownloadJobQueueStoredState } from "ropegeo-common/download";

export const DOWNLOAD_JOB_STORE_KEY = "@ropegeo/download-job-store/v2";

const EMPTY_STORE: DownloadJobQueueStoredState = {
  queueOrder: [],
  jobs: {},
};

export async function loadDownloadJobStore(): Promise<DownloadJobQueueStoredState | null> {
  const raw = await AsyncStorage.getItem(DOWNLOAD_JOB_STORE_KEY);
  if (raw == null || raw === "") {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as DownloadJobQueueStoredState;
    if (parsed == null || typeof parsed !== "object") {
      return null;
    }
    return {
      queueOrder: Array.isArray(parsed.queueOrder) ? parsed.queueOrder : [],
      jobs: parsed.jobs ?? {},
    };
  } catch {
    return null;
  }
}

export async function saveDownloadJobStore(
  snapshot: DownloadJobQueueStoredState,
): Promise<void> {
  await AsyncStorage.setItem(DOWNLOAD_JOB_STORE_KEY, JSON.stringify(snapshot));
}
