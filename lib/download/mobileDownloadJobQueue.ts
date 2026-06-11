import { DownloadJobQueue } from "ropegeo-common/download";
import { createMobileDownloadPlatformHarness } from "./createMobileDownloadPlatformHarness";

const platformHarness = createMobileDownloadPlatformHarness();

export const mobileDownloadJobQueue = DownloadJobQueue.getInstance(platformHarness);

export { platformHarness as mobileDownloadPlatformHarness };
