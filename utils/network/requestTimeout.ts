/**
 * App-owned HTTP deadline (seconds) for ropegeo-common request wrappers and download fetches.
 * Keep aligned with product expectations; request wrappers no longer apply a timeout unless set.
 */
export const REQUEST_TIMEOUT_SECONDS = 30;
