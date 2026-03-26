import * as FileSystem from "expo-file-system/legacy";
import { ImageVersions, type RopewikiPageView } from "ropegeo-common";
import { ensureParentDir, extFromUrl } from "@/lib/downloadQueue/util/downloadUtils";
import type { DownloadContext } from "@/lib/downloadQueue/downloadTask";

type ImageAcc = Record<
  string,
  { preview?: string; banner?: string; full?: string }
>;

function plannedImageBytes(view: RopewikiPageView): number {
  let sum = 0;
  const b = view.bannerImage;
  if (b?.downloadBytes) {
    if (b.bannerUrl) sum += b.downloadBytes.banner;
    if (b.fullUrl) sum += b.downloadBytes.full;
  }
  for (const sec of view.betaSections) {
    for (const im of sec.images) {
      if (im.downloadBytes) {
        if (im.bannerUrl) sum += im.downloadBytes.banner;
        if (im.fullUrl) sum += im.downloadBytes.full;
      }
    }
  }
  return Math.max(sum, 1);
}

function finalizeImages(acc: ImageAcc): Record<string, ImageVersions> {
  const out: Record<string, ImageVersions> = {};
  for (const [id, v] of Object.entries(acc)) {
    out[id] = new ImageVersions(
      v.preview ?? null,
      v.banner ?? null,
      v.full ?? null,
    );
  }
  return out;
}

export async function downloadImages(
  ctx: DownloadContext,
  view: RopewikiPageView,
): Promise<Record<string, ImageVersions>> {
  const acc: ImageAcc = {};
  let bytesDone = 0;
  const denom = plannedImageBytes(view);
  ctx.onProgress({ phase: 2, phaseProgress: 0 });

  const banner = view.bannerImage;
  if (banner != null) {
    const id = banner.id;
    if (!acc[id]) acc[id] = {};
    if (banner.bannerUrl) {
      const dest = `${ctx.pageRoot}images/${id}-banner${extFromUrl(banner.bannerUrl)}`;
      await ensureParentDir(dest);
      const r = await FileSystem.downloadAsync(banner.bannerUrl, dest);
      acc[id].banner = r.uri;
      bytesDone += banner.downloadBytes?.banner ?? 0;
      ctx.onProgress({ phase: 2, phaseProgress: Math.min(1, bytesDone / denom) });
    }
    if (banner.fullUrl) {
      const dest = `${ctx.pageRoot}images/${id}-full${extFromUrl(banner.fullUrl)}`;
      await ensureParentDir(dest);
      const r = await FileSystem.downloadAsync(banner.fullUrl, dest);
      acc[id].full = r.uri;
      bytesDone += banner.downloadBytes?.full ?? 0;
      ctx.onProgress({ phase: 2, phaseProgress: Math.min(1, bytesDone / denom) });
    }
  }

  for (const sec of view.betaSections) {
    for (const im of sec.images) {
      const id = im.id;
      if (!acc[id]) acc[id] = {};
      if (im.bannerUrl) {
        const dest = `${ctx.pageRoot}images/${id}-banner${extFromUrl(im.bannerUrl)}`;
        await ensureParentDir(dest);
        const r = await FileSystem.downloadAsync(im.bannerUrl, dest);
        acc[id].banner = r.uri;
        bytesDone += im.downloadBytes?.banner ?? 0;
        ctx.onProgress({ phase: 2, phaseProgress: Math.min(1, bytesDone / denom) });
      }
      if (im.fullUrl) {
        const dest = `${ctx.pageRoot}images/${id}-full${extFromUrl(im.fullUrl)}`;
        await ensureParentDir(dest);
        const r = await FileSystem.downloadAsync(im.fullUrl, dest);
        acc[id].full = r.uri;
        bytesDone += im.downloadBytes?.full ?? 0;
        ctx.onProgress({ phase: 2, phaseProgress: Math.min(1, bytesDone / denom) });
      }
    }
  }

  ctx.onProgress({ phase: 2, phaseProgress: 1 });
  return finalizeImages(acc);
}
