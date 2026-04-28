/** Shape used by the routes progress toast helper (e.g. explore / region routes state). */
export type RoutesLoadToastSource = {
  loading: boolean;
  /** Stale-while-revalidate: refetch in flight while prior route data is still shown. */
  refreshing?: boolean;
  errors: Error | null;
  received: number;
  total: number | null;
};

/** Success {@link ProgressToast} linger after routes finish loading. */
export const ROUTES_LOAD_SUCCESS_LINGER_MS = 3000;

/**
 * Copy and progress for {@link ProgressToast} while paginated GET /routes loads.
 * When `total` is null (first response not yet parsed), progress is 0% per product spec.
 */
export function formatRoutesLoadingTitle(
  received: number,
  total: number | null,
): string {
  const pct =
    total != null && total > 0
      ? Math.round((received / total) * 100)
      : 0;
  return `Loading routes ${received} (${pct}%)`;
}

/** Progress title while re-fetching routes after reconnect (filters changed while offline). */
export function formatRoutesRefreshingTitle(
  received: number,
  total: number | null,
): string {
  const pct =
    total != null && total > 0
      ? Math.round((received / total) * 100)
      : 0;
  return `Refreshing routes ... ${received} (${pct}%)`;
}

/** Bar fill 0–1; 0 when total is unknown or non-positive. */
export function routesLoadingProgress01(
  received: number,
  total: number | null,
): number {
  if (total == null || total <= 0) return 0;
  return Math.min(1, Math.max(0, received / total));
}

/** Title after a successful routes fetch (linger state). */
export function formatRoutesLoadedSuccessTitle(routeCount: number): string {
  return `Loaded routes ${routeCount} (100%)`;
}
