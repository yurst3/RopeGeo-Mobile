import type { RoutesParams } from "ropegeo-common/models";

/** Converts {@link RoutesParams} to flat query keys (e.g. for manual fetch URLs; includes `limit` / `page`). */
export function routesParamsToQueryRecord(
  params: RoutesParams,
): Record<string, string> {
  const qs = params.toQueryString();
  if (qs === "") return {};
  const sp = new URLSearchParams(qs);
  const out: Record<string, string> = {};
  sp.forEach((v, k) => {
    out[k] = v;
  });
  return out;
}
