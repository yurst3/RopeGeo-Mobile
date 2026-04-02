import type { RoutesParams } from "ropegeo-common/classes";

/** Converts {@link RoutesParams} to flat query keys for {@link RopeGeoHttpRequest}. */
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
