import type { OfflinePagePreview, OnlinePagePreview } from "ropegeo-common/models";

/** Saved pages may be offline previews, so a selection can hold either kind. */
export type SelectedPagePreview = OnlinePagePreview | OfflinePagePreview;

/**
 * Hands selected page previews between the page-select search screen and the screen that
 * opened it. Previews are class instances, so they can't travel through route params; the
 * opener registers its current selection and a callback, and passes only the request id.
 */
type PageSelectionRequest = {
  initialPages: SelectedPagePreview[];
  onResult: (pages: SelectedPagePreview[]) => void;
};

const pendingRequests = new Map<string, PageSelectionRequest>();
let nextRequestId = 0;

export function requestPageSelection(request: PageSelectionRequest): string {
  nextRequestId += 1;
  const requestId = `page-select-${nextRequestId}`;
  pendingRequests.set(requestId, request);
  return requestId;
}

/** The selection the opener already had, so the screen can start with it checked. */
export function getInitialPageSelection(requestId: string): SelectedPagePreview[] {
  return pendingRequests.get(requestId)?.initialPages ?? [];
}

/** Delivers the selection once; later calls for the same id are ignored. */
export function resolvePageSelection(
  requestId: string,
  pages: SelectedPagePreview[],
): void {
  const request = pendingRequests.get(requestId);
  pendingRequests.delete(requestId);
  request?.onResult(pages);
}
