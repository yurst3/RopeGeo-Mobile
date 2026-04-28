/** Horizontal inset so toasts clear header circle buttons (16 + 44 + 8). */
export const TOAST_HORIZONTAL_INSET = 16 + 44 + 8;

export const SAVED_TOAST_DURATION_MS = 2000;
export const SAVED_TOAST_FADE_IN_MS = 250;
export const SAVED_TOAST_FADE_OUT_MS = 300;

export const DOWNLOAD_TOAST_FADE_IN_MS = 250;
export const DOWNLOAD_TOAST_FADE_OUT_MS = 300;

export const SAVED_TOAST_BG = "rgba(0, 90, 55, 0.88)";
export const SAVED_TOAST_TEXT = "#86efac";

export const DOWNLOAD_TOAST_BG = "rgba(55, 48, 0, 0.9)";
export const DOWNLOAD_TOAST_TEXT = "#fde047";

export const DOWNLOAD_COMPLETE_BG = SAVED_TOAST_BG;
export const DOWNLOAD_COMPLETE_TEXT = SAVED_TOAST_TEXT;

export const DOWNLOAD_FAIL_BG = "rgba(80, 0, 0, 0.88)";
export const DOWNLOAD_FAIL_TEXT = "#fca5a5";

/** Default auto-hide for global (app-level) pill toasts. */
export const APP_TOAST_DEFAULT_DURATION_MS = 5000;
/** Start showing the "slow network" toast when request countdown reaches this window. */
export const NETWORK_REQUEST_SLOW_THRESHOLD_MS = 20_000;

/**
 * Vertical gap between stacked toasts (from the estimated bottom of one row to the top of the
 * next). Used with row-height estimates in `ToastContext` layout.
 */
export const TOAST_STACK_GAP = 8;
/** When stacked `top` changes after a sibling finishes fading out, animate to the new slot. */
export const TOAST_STACK_REPOSITION_MS = 280;

/** Approximate row height for stack layout (pill + padding; matches `Toast` styles). */
export const TOAST_STACK_ROW_HEIGHT_PILL_SINGLE = 48;
export const TOAST_STACK_ROW_HEIGHT_PILL_SUBTITLE = 78;
/** Action toast: one line + icon row (`ActionToast`). */
export const TOAST_STACK_ROW_HEIGHT_ACTION = 50;
/** Progress toast with bar (`ProgressToast` `kind === "progress"`). */
export const TOAST_STACK_ROW_HEIGHT_PROGRESS_BAR = 80;
/** Progress toast success/error pill (`ProgressToast` non-progress kinds). */
export const TOAST_STACK_ROW_HEIGHT_PROGRESS_PILL = 52;
