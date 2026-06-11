import { mobileDownloadJobQueue } from "@/lib/download/mobileDownloadJobQueue";
import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";

export const PAGE_DOWNLOAD_BACKGROUND_TASK = "ropegeo-page-download-chunk";

let taskDefined = false;

export function ensureDownloadBackgroundTaskDefined(): void {
  if (taskDefined) {
    return;
  }
  taskDefined = true;

  TaskManager.defineTask(PAGE_DOWNLOAD_BACKGROUND_TASK, async () => {
    try {
      await mobileDownloadJobQueue.runSingleBackgroundTick();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
      console.warn("[DownloadBackgroundTask] tick failed", error);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export async function registerDownloadBackgroundTask(): Promise<void> {
  ensureDownloadBackgroundTaskDefined();
  try {
    await BackgroundTask.registerTaskAsync(PAGE_DOWNLOAD_BACKGROUND_TASK, {
      minimumInterval: 15,
    });
  } catch (error) {
    console.warn("[DownloadBackgroundTask] register failed", error);
  }
}

ensureDownloadBackgroundTaskDefined();
