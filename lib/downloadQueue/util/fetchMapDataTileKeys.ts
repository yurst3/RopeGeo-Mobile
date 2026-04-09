import { PaginationResults } from "ropegeo-common/models";
import { SERVICE_BASE_URL, Service } from "ropegeo-common/components";

const WEB_BASE = SERVICE_BASE_URL[Service.WEBSCRAPER];

export async function fetchMapDataTileKeys<R>(
  mapDataId: string,
  page: number,
  limit: number,
): Promise<R> {
  const url = new URL(
    `mapdata/${encodeURIComponent(mapDataId)}/tiles`,
    WEB_BASE,
  );
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Tile list failed: HTTP ${res.status}`);
  }
  const body = (await res.json()) as unknown;
  return PaginationResults.fromResponseBody(body) as R;
}
