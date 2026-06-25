import type { DownloadJob, DownloadPlatformHarness } from "ropegeo-common/download";
import {
  OfflinePagePreview,
  OfflineRopewikiPageView,
  SavedPage,
} from "ropegeo-common/models";

export async function savedPageFromCompletedJob(
  job: DownloadJob,
  harness: DownloadPlatformHarness,
): Promise<SavedPage> {
  const pageJsonUri = harness.paths.pageJson(job.pageId);
  const text = await harness.readTextFile(pageJsonUri);
  const raw = JSON.parse(text) as unknown;
  const offlineView = OfflineRopewikiPageView.fromResult(raw);
  const preview = offlineView.toPagePreview() as OfflinePagePreview;
  return new SavedPage(preview, job.config.savedAt, pageJsonUri);
}
