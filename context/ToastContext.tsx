import { ActionToast } from "@/components/toast/ActionToast";
import { ProgressToast, type ProgressToastKind } from "@/components/toast/ProgressToast";
import { Toast, type ToastVariant } from "@/components/toast/Toast";
import { STACKED_TOAST_BASE_OFFSET_BELOW_SAFE_TOP } from "@/components/minimap/shared/fullScreenMapLayout";
import {
  DOWNLOAD_TOAST_FADE_OUT_MS,
  SAVED_TOAST_FADE_OUT_MS,
  TOAST_HORIZONTAL_INSET,
  TOAST_STACK_GAP,
  TOAST_STACK_ROW_HEIGHT_ACTION,
  TOAST_STACK_ROW_HEIGHT_PILL_SINGLE,
  TOAST_STACK_ROW_HEIGHT_PILL_SUBTITLE,
  TOAST_STACK_ROW_HEIGHT_PROGRESS_BAR,
  TOAST_STACK_ROW_HEIGHT_PROGRESS_PILL,
} from "@/constants/toast";
import {
  getToastArchetypeForKey,
  routeAllowedByPatterns,
  toastStackPriorityForKey,
} from "@/constants/toastArchetypes";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { StyleSheet, View, type ImageSourcePropType } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function withMultipleSuffix(text: string, multiple: number): string {
  return multiple > 1 ? `${text} x${multiple}` : text;
}

export class ToastKeyCollisionError extends Error {
  readonly key: string;

  constructor(key: string) {
    super(`Toast with key "${key}" already exists`);
    this.name = "ToastKeyCollisionError";
    this.key = key;
  }
}

export class ToastKeyNotFoundError extends Error {
  readonly key: string;

  constructor(key: string) {
    super(`Toast with key "${key}" was not found`);
    this.name = "ToastKeyNotFoundError";
    this.key = key;
  }
}

type BaseToastModel = {
  key: string;
  /**
   * Route whitelist; supports dynamic path params (`[id]`). `null` means globally allowed.
   */
  allowedRoutes: string[] | null;
  horizontalInset: number;
  zIndex: number;
  /** Rendered as "xN" suffix when > 1. */
  multiple: number;
  /** `null` = no auto-dismiss. */
  durationMs: number | null;
  /**
   * Monotonic insert order for tie-breaking equal priorities (smaller = older = higher on screen).
   */
  insertedAt: number;
  /**
   * When true, the toast stays in the stack while the view fades out, then it is removed.
   * Still visible (fading) — not an invisible placeholder row.
   */
  exiting: boolean;
};

export type PillToastModel = BaseToastModel & {
  mode: "pill";
  variant: ToastVariant;
  message: string;
  subtitle?: string;
};

export type ProgressToastModel = BaseToastModel & {
  mode: "progress";
  progressKind: ProgressToastKind;
  title: string;
  progress: number;
};

export type ActionToastModel = BaseToastModel & {
  mode: "action";
  message: string;
  icon: ImageSourcePropType;
  /** Foreground (text and icon tint). */
  color: string;
  /** Panel background; omit for default warning-style panel. */
  backgroundColor?: string;
};

export type ToastModel = PillToastModel | ProgressToastModel | ActionToastModel;

export type ToastKey = string;

export type ShowPillToastOptions = {
  key: ToastKey;
  variant: ToastVariant;
  message: string;
  subtitle?: string;
  /** When omitted, defaults from `getToastArchetypeForKey(key)`. */
  allowedRoutes?: string[] | null;
  multiple?: number;
  durationMs?: number | null;
  horizontalInset?: number;
  zIndex?: number;
  /** Called once when this toast is removed (dismiss, timer, or replaced). Not stored on the model. */
  onDismissed?: () => void;
};

export type ShowProgressToastOptions = {
  key: ToastKey;
  progressKind: ProgressToastKind;
  title: string;
  progress?: number;
  /** When omitted, defaults from `getToastArchetypeForKey(key)`. */
  allowedRoutes?: string[] | null;
  multiple?: number;
  durationMs?: number | null;
  horizontalInset?: number;
  zIndex?: number;
  /** Called once when this toast is removed (dismiss, timer, or replaced). Not stored on the model. */
  onDismissed?: () => void;
};

export type ShowActionToastOptions = {
  key: ToastKey;
  message: string;
  icon: ImageSourcePropType;
  color: string;
  backgroundColor?: string;
  /** When omitted, defaults from `getToastArchetypeForKey(key)`. */
  allowedRoutes?: string[] | null;
  multiple?: number;
  durationMs?: number | null;
  horizontalInset?: number;
  zIndex?: number;
  onDismissed?: () => void;
  /** Invoked when the user presses the toast. Not stored on the toast model. */
  onPress: () => void;
};

/** Partial update; set `mode` to switch between pill and progress for the same `key`. */
export type ToastUpdate =
  | ({
      mode?: "pill";
      variant?: ToastVariant;
      message?: string;
      subtitle?: string;
      multiple?: number;
      allowedRoutes?: string[] | null;
      horizontalInset?: number;
      zIndex?: number;
      durationMs?: number | null;
    } & { convertTo?: never })
  | {
      mode: "progress";
      progressKind?: ProgressToastKind;
      title?: string;
      progress?: number;
      multiple?: number;
      allowedRoutes?: string[] | null;
      horizontalInset?: number;
      zIndex?: number;
      durationMs?: number | null;
    }
  | {
      mode: "pill";
      variant?: ToastVariant;
      message?: string;
      subtitle?: string;
      multiple?: number;
      allowedRoutes?: string[] | null;
      horizontalInset?: number;
      zIndex?: number;
      durationMs?: number | null;
    }
  | {
      mode: "action";
      message?: string;
      icon?: ImageSourcePropType;
      color?: string;
      backgroundColor?: string;
      multiple?: number;
      allowedRoutes?: string[] | null;
      horizontalInset?: number;
      zIndex?: number;
      durationMs?: number | null;
    };

function estimatedStackRowHeight(t: ToastModel): number {
  if (t.mode === "pill") {
    const hasSubtitle =
      t.subtitle != null && String(t.subtitle).trim().length > 0;
    return hasSubtitle
      ? TOAST_STACK_ROW_HEIGHT_PILL_SUBTITLE
      : TOAST_STACK_ROW_HEIGHT_PILL_SINGLE;
  }
  if (t.mode === "action") {
    return TOAST_STACK_ROW_HEIGHT_ACTION;
  }
  if (t.mode === "progress") {
    return t.progressKind === "progress"
      ? TOAST_STACK_ROW_HEIGHT_PROGRESS_BAR
      : TOAST_STACK_ROW_HEIGHT_PROGRESS_PILL;
  }
  const _exhaustive: never = t;
  return _exhaustive;
}

/**
 * Stack order matches visual order (anchor = top toast). Each row's `top` is followed by a fixed
 * {@link TOAST_STACK_GAP} so spacing stays even when row heights differ.
 */
function applyGlobalToastLayout(
  toasts: ToastModel[],
  anchorY: number,
): Array<ToastModel & { top: number }> {
  const order = [...toasts]
    .map((t) => ({ t }))
    .sort((a, b) => {
      const pa = toastStackPriorityForKey(a.t.key);
      const pb = toastStackPriorityForKey(b.t.key);
      if (pa !== pb) return pa - pb;
      return a.t.insertedAt - b.t.insertedAt;
    });
  const keyToTop = new Map<string, number>();
  let y = anchorY;
  for (const { t } of order) {
    keyToTop.set(t.key, y);
    y += estimatedStackRowHeight(t) + TOAST_STACK_GAP;
  }
  return toasts.map((t) => ({
    ...t,
    top: keyToTop.get(t.key) ?? anchorY,
  }));
}

function resolveDefaultAllowedRoutes(key: ToastKey): string[] | null {
  return getToastArchetypeForKey(key)?.allowedRoutes ?? null;
}

function resolveDefaultDurationMs(key: ToastKey): number | null {
  return getToastArchetypeForKey(key)?.durationMs ?? null;
}

function mergeToast(cur: ToastModel, patch: ToastUpdate): ToastModel {
  const p = patch as Record<string, unknown>;
  const nextAllowedRoutes =
    p.allowedRoutes === undefined
      ? cur.allowedRoutes
      : (p.allowedRoutes as string[] | null);
  const targetMode =
    p.mode !== undefined && p.mode != null
      ? (p.mode as ToastModel["mode"])
      : cur.mode;

  if (targetMode === "progress") {
    if (cur.mode === "pill") {
      const c = cur as PillToastModel;
      return {
        key: c.key,
        mode: "progress",
        allowedRoutes: nextAllowedRoutes,
        horizontalInset:
          (p.horizontalInset as number | undefined) ?? c.horizontalInset,
        zIndex: (p.zIndex as number | undefined) ?? c.zIndex,
        durationMs:
          p.durationMs !== undefined
            ? (p.durationMs as number | null)
            : c.durationMs,
        progressKind:
          (p.progressKind as ProgressToastKind | undefined) ?? "progress",
        title: (p.title as string | undefined) ?? "",
        progress: (p.progress as number | undefined) ?? 0,
        multiple: (p.multiple as number | undefined) ?? c.multiple,
        insertedAt: c.insertedAt,
        exiting: c.exiting,
      };
    }
    if (cur.mode === "action") {
      const c = cur as ActionToastModel;
      return {
        key: c.key,
        mode: "progress",
        allowedRoutes: nextAllowedRoutes,
        horizontalInset:
          (p.horizontalInset as number | undefined) ?? c.horizontalInset,
        zIndex: (p.zIndex as number | undefined) ?? c.zIndex,
        durationMs:
          p.durationMs !== undefined
            ? (p.durationMs as number | null)
            : c.durationMs,
        progressKind:
          (p.progressKind as ProgressToastKind | undefined) ?? "progress",
        title: (p.title as string | undefined) ?? c.message,
        progress: (p.progress as number | undefined) ?? 0,
        multiple: (p.multiple as number | undefined) ?? c.multiple,
        insertedAt: c.insertedAt,
        exiting: c.exiting,
      };
    }
    const c = cur as ProgressToastModel;
    return {
      ...c,
      allowedRoutes: nextAllowedRoutes,
      progressKind:
        (p.progressKind as ProgressToastKind | undefined) ?? c.progressKind,
      title: (p.title as string | undefined) ?? c.title,
      progress: (p.progress as number | undefined) ?? c.progress,
      multiple: (p.multiple as number | undefined) ?? c.multiple,
      horizontalInset:
        (p.horizontalInset as number | undefined) ?? c.horizontalInset,
      zIndex: (p.zIndex as number | undefined) ?? c.zIndex,
      durationMs:
        p.durationMs !== undefined
          ? (p.durationMs as number | null)
          : c.durationMs,
    };
  }

  if (cur.mode === "progress" && targetMode === "pill") {
    const c = cur as ProgressToastModel;
    const message =
      (typeof p.message === "string" ? p.message : undefined) ??
      (typeof p.title === "string" ? p.title : undefined) ??
      "";
    return {
      key: c.key,
      mode: "pill",
      allowedRoutes: nextAllowedRoutes,
      horizontalInset:
        (p.horizontalInset as number | undefined) ?? c.horizontalInset,
      zIndex: (p.zIndex as number | undefined) ?? c.zIndex,
      durationMs:
        p.durationMs !== undefined
          ? (p.durationMs as number | null)
          : c.durationMs,
      variant: (p.variant as ToastVariant | undefined) ?? "warning",
      message,
      multiple: (p.multiple as number | undefined) ?? c.multiple,
      subtitle:
        p.subtitle === undefined ? undefined : (p.subtitle as string | undefined),
      insertedAt: c.insertedAt,
      exiting: c.exiting,
    };
  }

  if (cur.mode === "progress" && targetMode === "action") {
    const c = cur as ProgressToastModel;
    const icon = p.icon as ImageSourcePropType | undefined;
    if (icon == null) {
      throw new Error("mergeToast: switching progress to action requires `icon` in the patch");
    }
    return {
      key: c.key,
      mode: "action",
      allowedRoutes: nextAllowedRoutes,
      message: (typeof p.message === "string" ? p.message : undefined) ?? c.title,
      icon,
      color: (typeof p.color === "string" ? p.color : undefined) ?? "#ffffff",
      backgroundColor:
        typeof p.backgroundColor === "string" ? p.backgroundColor : undefined,
      horizontalInset:
        (p.horizontalInset as number | undefined) ?? c.horizontalInset,
      zIndex: (p.zIndex as number | undefined) ?? c.zIndex,
      durationMs:
        p.durationMs !== undefined
          ? (p.durationMs as number | null)
          : c.durationMs,
      multiple: (p.multiple as number | undefined) ?? c.multiple,
      insertedAt: c.insertedAt,
      exiting: c.exiting,
    };
  }

  if (cur.mode === "pill" && targetMode === "action") {
    const c = cur as PillToastModel;
    const icon = p.icon as ImageSourcePropType | undefined;
    if (icon == null) {
      throw new Error("mergeToast: switching pill to action requires `icon` in the patch");
    }
    return {
      key: c.key,
      mode: "action",
      allowedRoutes: nextAllowedRoutes,
      message: (typeof p.message === "string" ? p.message : undefined) ?? c.message,
      icon,
      color: (typeof p.color === "string" ? p.color : undefined) ?? "#ffffff",
      backgroundColor:
        typeof p.backgroundColor === "string" ? p.backgroundColor : undefined,
      horizontalInset:
        (p.horizontalInset as number | undefined) ?? c.horizontalInset,
      zIndex: (p.zIndex as number | undefined) ?? c.zIndex,
      durationMs:
        p.durationMs !== undefined
          ? (p.durationMs as number | null)
          : c.durationMs,
      multiple: (p.multiple as number | undefined) ?? c.multiple,
      insertedAt: c.insertedAt,
      exiting: c.exiting,
    };
  }

  if (cur.mode === "action") {
    const c = cur as ActionToastModel;
    if (targetMode === "pill") {
      const message =
        (typeof p.message === "string" ? p.message : undefined) ?? c.message;
      return {
        key: c.key,
        mode: "pill",
        allowedRoutes: nextAllowedRoutes,
        horizontalInset:
          (p.horizontalInset as number | undefined) ?? c.horizontalInset,
        zIndex: (p.zIndex as number | undefined) ?? c.zIndex,
        durationMs:
          p.durationMs !== undefined
            ? (p.durationMs as number | null)
            : c.durationMs,
        variant: (p.variant as ToastVariant | undefined) ?? "warning",
        message,
        multiple: (p.multiple as number | undefined) ?? c.multiple,
        subtitle:
          p.subtitle === undefined ? undefined : (p.subtitle as string | undefined),
        insertedAt: c.insertedAt,
        exiting: c.exiting,
      };
    }
    return {
      ...c,
      allowedRoutes: nextAllowedRoutes,
      message: (typeof p.message === "string" ? p.message : undefined) ?? c.message,
      icon: (p.icon as ImageSourcePropType | undefined) ?? c.icon,
      color: (typeof p.color === "string" ? p.color : undefined) ?? c.color,
      backgroundColor:
        typeof p.backgroundColor === "string"
          ? p.backgroundColor
          : c.backgroundColor,
      multiple: (p.multiple as number | undefined) ?? c.multiple,
      horizontalInset:
        (p.horizontalInset as number | undefined) ?? c.horizontalInset,
      zIndex: (p.zIndex as number | undefined) ?? c.zIndex,
      durationMs:
        p.durationMs !== undefined
          ? (p.durationMs as number | null)
          : c.durationMs,
    };
  }

  const c = cur as PillToastModel;
  return {
    ...c,
    allowedRoutes: nextAllowedRoutes,
    variant: (p.variant as ToastVariant | undefined) ?? c.variant,
    message: (typeof p.message === "string" ? p.message : undefined) ?? c.message,
    multiple: (p.multiple as number | undefined) ?? c.multiple,
    subtitle:
      p.subtitle === undefined ? c.subtitle : (p.subtitle as string | undefined),
    horizontalInset:
      (p.horizontalInset as number | undefined) ?? c.horizontalInset,
    zIndex: (p.zIndex as number | undefined) ?? c.zIndex,
    durationMs:
      p.durationMs !== undefined
        ? (p.durationMs as number | null)
        : c.durationMs,
  };
}

export type ToastContextValue = {
  /** Number of toasts currently in the stack. */
  toastCount: number;
  /**
   * Sets the Y position (from the top of the screen) where slot 0 of the global toast stack starts.
   * Call from navigation when the active route changes (e.g. once per screen).
   */
  setToastStackTopPosition: (top: number) => void;
  showPill: (opts: ShowPillToastOptions) => ToastKey;
  upsertPill: (opts: ShowPillToastOptions) => ToastKey;
  showActionToast: (opts: ShowActionToastOptions) => ToastKey;
  upsertActionToast: (opts: ShowActionToastOptions) => ToastKey;
  showProgress: (opts: ShowProgressToastOptions) => ToastKey;
  upsertProgress: (opts: ShowProgressToastOptions) => ToastKey;
  updateToast: (key: ToastKey, patch: ToastUpdate) => void;
  incrementMultiple: (key: ToastKey) => number;
  /**
   * Starts fade-out, then removes the toast. Pass `{ immediate: true }` to remove synchronously
   * (no animation) when the same key must be free before the next commit.
   */
  dismiss: (key: ToastKey, options?: { immediate?: boolean }) => void;
  /** Dismisses toasts whose `allowedRoutes` does not include `currentRoute`. */
  dismissUnallowedToasts: (currentRoute: string) => void;
  dismissAll: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (ctx == null) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

type ToastProviderProps = { children: ReactNode };

export function ToastProvider({ children }: ToastProviderProps) {
  const insets = useSafeAreaInsets();
  const defaultStackAnchorY = insets.top + STACKED_TOAST_BASE_OFFSET_BELOW_SAFE_TOP;
  const [toastStackAnchorY, setToastStackAnchorY] = useState<number | null>(null);
  const stackAnchorY = toastStackAnchorY ?? defaultStackAnchorY;
  const [toasts, setToasts] = useState<ToastModel[]>([]);
  /** Mirrors committed toast list for synchronous collision checks (do not assign from render — stale before commit). */
  const toastsRef = useRef<ToastModel[]>([]);
  const insertedAtSeqRef = useRef(0);
  const nextInsertedAt = useCallback(
    () => ++insertedAtSeqRef.current,
    [],
  );
  const timersRef = useRef<Map<ToastKey, ReturnType<typeof setTimeout>>>(new Map());
  /** Side-channel: `onDismissed` from show/upsert options (not part of the toast model). */
  const dismissCallbacksRef = useRef<Map<ToastKey, () => void>>(new Map());

  const setToastStackTopPosition = useCallback((top: number) => {
    setToastStackAnchorY(top);
  }, []);

  const clearTimer = useCallback((key: ToastKey) => {
    const t = timersRef.current.get(key);
    if (t != null) {
      clearTimeout(t);
      timersRef.current.delete(key);
    }
  }, []);

  const flushDismissCallback = useCallback((key: ToastKey) => {
    const fn = dismissCallbacksRef.current.get(key);
    if (fn == null) return;
    dismissCallbacksRef.current.delete(key);
    try {
      fn();
    } catch {
      /* ignore user callback errors */
    }
  }, []);

  const registerDismissCallback = useCallback((key: ToastKey, fn: (() => void) | undefined) => {
    if (fn != null) {
      dismissCallbacksRef.current.set(key, fn);
    } else {
      dismissCallbacksRef.current.delete(key);
    }
  }, []);

  /** Side-channel: `onPress` from show/upsert action options (not part of the toast model). */
  const actionCallbacksRef = useRef<Map<ToastKey, () => void>>(new Map());

  /** Drop `onPress` without invoking it (dismiss / navigate away must not trigger retry). */
  const releaseActionCallback = useCallback((key: ToastKey) => {
    actionCallbacksRef.current.delete(key);
  }, []);

  const registerActionCallback = useCallback((key: ToastKey, fn: (() => void) | undefined) => {
    if (fn != null) {
      actionCallbacksRef.current.set(key, fn);
    } else {
      actionCallbacksRef.current.delete(key);
    }
  }, []);

  const finalizeRemoveToast = useCallback(
    (key: ToastKey) => {
      setToasts((prev) => {
        if (!prev.some((x) => x.key === key)) {
          toastsRef.current = prev;
          return prev;
        }
        const next = prev.filter((x) => x.key !== key);
        toastsRef.current = next;
        return next;
      });
      queueMicrotask(() => {
        flushDismissCallback(key);
        releaseActionCallback(key);
      });
    },
    [flushDismissCallback, releaseActionCallback],
  );

  const beginExitToast = useCallback(
    (key: ToastKey) => {
      clearTimer(key);
      setToasts((prev) => {
        const i = prev.findIndex((t) => t.key === key);
        if (i < 0) {
          toastsRef.current = prev;
          return prev;
        }
        if (prev[i]!.exiting) {
          toastsRef.current = prev;
          return prev;
        }
        const copy = [...prev];
        copy[i] = { ...prev[i]!, exiting: true };
        toastsRef.current = copy;
        return copy;
      });
    },
    [clearTimer],
  );

  const armTimer = useCallback(
    (key: ToastKey, durationMs: number | null) => {
      clearTimer(key);
      if (durationMs == null || durationMs <= 0) return;
      const t = setTimeout(() => {
        timersRef.current.delete(key);
        beginExitToast(key);
      }, durationMs);
      timersRef.current.set(key, t);
    },
    [clearTimer, beginExitToast],
  );

  const showPill = useCallback(
    (opts: ShowPillToastOptions): ToastKey => {
      const existing = toastsRef.current.find((t) => t.key === opts.key);
      if (existing != null && !existing.exiting) {
        throw new ToastKeyCollisionError(opts.key);
      }
      const replacedExiting = existing?.exiting === true;
      const horizontalInset = opts.horizontalInset ?? TOAST_HORIZONTAL_INSET;
      const durationMs =
        opts.durationMs === undefined
          ? resolveDefaultDurationMs(opts.key)
          : opts.durationMs;
      const allowedRoutes =
        opts.allowedRoutes === undefined
          ? resolveDefaultAllowedRoutes(opts.key)
          : opts.allowedRoutes;
      if (replacedExiting) {
        clearTimer(opts.key);
      }
      setToasts((prev) => {
        if (!replacedExiting && prev.some((t) => t.key === opts.key)) {
          throw new ToastKeyCollisionError(opts.key);
        }
        const base = replacedExiting ? prev.filter((t) => t.key !== opts.key) : prev;
        if (base.some((t) => t.key === opts.key)) {
          throw new ToastKeyCollisionError(opts.key);
        }
        const zIndex = opts.zIndex ?? 99999 + base.length;
        const entry: PillToastModel = {
          key: opts.key,
          mode: "pill",
          allowedRoutes,
          variant: opts.variant,
          message: opts.message,
          subtitle: opts.subtitle,
          multiple: opts.multiple ?? 1,
          horizontalInset,
          zIndex,
          durationMs,
          insertedAt: nextInsertedAt(),
          exiting: false,
        };
        const next = [...base, entry];
        toastsRef.current = next;
        return next;
      });
      if (replacedExiting) {
        flushDismissCallback(opts.key);
        releaseActionCallback(opts.key);
      }
      registerDismissCallback(opts.key, opts.onDismissed);
      armTimer(opts.key, durationMs);
      return opts.key;
    },
    [
      armTimer,
      clearTimer,
      flushDismissCallback,
      nextInsertedAt,
      registerDismissCallback,
      releaseActionCallback,
    ],
  );

  const showActionToast = useCallback(
    (opts: ShowActionToastOptions): ToastKey => {
      const existing = toastsRef.current.find((t) => t.key === opts.key);
      if (existing != null && !existing.exiting) {
        throw new ToastKeyCollisionError(opts.key);
      }
      const replacedExiting = existing?.exiting === true;
      const horizontalInset = opts.horizontalInset ?? TOAST_HORIZONTAL_INSET;
      const durationMs =
        opts.durationMs === undefined
          ? resolveDefaultDurationMs(opts.key)
          : opts.durationMs;
      const allowedRoutes =
        opts.allowedRoutes === undefined
          ? resolveDefaultAllowedRoutes(opts.key)
          : opts.allowedRoutes;
      if (replacedExiting) {
        clearTimer(opts.key);
      }
      setToasts((prev) => {
        if (!replacedExiting && prev.some((t) => t.key === opts.key)) {
          throw new ToastKeyCollisionError(opts.key);
        }
        const base = replacedExiting ? prev.filter((t) => t.key !== opts.key) : prev;
        if (base.some((t) => t.key === opts.key)) {
          throw new ToastKeyCollisionError(opts.key);
        }
        const zIndex = opts.zIndex ?? 99999 + base.length;
        const entry: ActionToastModel = {
          key: opts.key,
          mode: "action",
          allowedRoutes,
          message: opts.message,
          icon: opts.icon,
          color: opts.color,
          backgroundColor: opts.backgroundColor,
          multiple: opts.multiple ?? 1,
          horizontalInset,
          zIndex,
          durationMs,
          insertedAt: nextInsertedAt(),
          exiting: false,
        };
        const next = [...base, entry];
        toastsRef.current = next;
        return next;
      });
      if (replacedExiting) {
        flushDismissCallback(opts.key);
        releaseActionCallback(opts.key);
      }
      registerDismissCallback(opts.key, opts.onDismissed);
      registerActionCallback(opts.key, opts.onPress);
      armTimer(opts.key, durationMs);
      return opts.key;
    },
    [
      armTimer,
      clearTimer,
      flushDismissCallback,
      nextInsertedAt,
      registerActionCallback,
      registerDismissCallback,
      releaseActionCallback,
    ],
  );

  const upsertActionToast = useCallback(
    (opts: ShowActionToastOptions): ToastKey => {
      const horizontalInset = opts.horizontalInset ?? TOAST_HORIZONTAL_INSET;
      const durationMs =
        opts.durationMs === undefined
          ? resolveDefaultDurationMs(opts.key)
          : opts.durationMs;
      const allowedRoutes =
        opts.allowedRoutes === undefined
          ? resolveDefaultAllowedRoutes(opts.key)
          : opts.allowedRoutes;

      setToasts((prev) => {
        const i = prev.findIndex((t) => t.key === opts.key);
        if (i < 0) {
          const zIndex = opts.zIndex ?? 99999 + prev.length;
          const entry: ActionToastModel = {
            key: opts.key,
            mode: "action",
            allowedRoutes,
            message: opts.message,
            icon: opts.icon,
            color: opts.color,
            backgroundColor: opts.backgroundColor,
            multiple: opts.multiple ?? 1,
            horizontalInset,
            zIndex,
            durationMs,
            insertedAt: nextInsertedAt(),
            exiting: false,
          };
          const next = [...prev, entry];
          toastsRef.current = next;
          return next;
        }

        const prevRow = prev[i]!;
        const insertedAt = prevRow.insertedAt;
        const nextRow: ActionToastModel =
          prevRow.mode === "action"
            ? {
                ...(mergeToast(prevRow, {
                  mode: "action",
                  message: opts.message,
                  icon: opts.icon,
                  color: opts.color,
                  backgroundColor: opts.backgroundColor,
                  allowedRoutes: opts.allowedRoutes,
                  multiple: opts.multiple,
                  horizontalInset: opts.horizontalInset,
                  zIndex: opts.zIndex,
                  durationMs,
                }) as ActionToastModel),
                insertedAt,
                exiting: false,
              }
            : {
                key: opts.key,
                mode: "action",
                allowedRoutes,
                message: opts.message,
                icon: opts.icon,
                color: opts.color,
                backgroundColor: opts.backgroundColor,
                multiple: opts.multiple ?? 1,
                horizontalInset,
                zIndex: opts.zIndex ?? prevRow.zIndex,
                durationMs,
                insertedAt,
                exiting: false,
              };

        const copy = [...prev];
        copy[i] = nextRow;
        toastsRef.current = copy;
        return copy;
      });

      queueMicrotask(() => {
        clearTimer(opts.key);
        registerDismissCallback(opts.key, opts.onDismissed);
        registerActionCallback(opts.key, opts.onPress);
        armTimer(opts.key, durationMs);
      });
      return opts.key;
    },
    [
      armTimer,
      clearTimer,
      nextInsertedAt,
      registerActionCallback,
      registerDismissCallback,
    ],
  );

  const upsertPill = useCallback(
    (opts: ShowPillToastOptions): ToastKey => {
      const horizontalInset = opts.horizontalInset ?? TOAST_HORIZONTAL_INSET;
      const durationMs =
        opts.durationMs === undefined
          ? resolveDefaultDurationMs(opts.key)
          : opts.durationMs;
      const allowedRoutes =
        opts.allowedRoutes === undefined
          ? resolveDefaultAllowedRoutes(opts.key)
          : opts.allowedRoutes;

      setToasts((prev) => {
        const i = prev.findIndex((t) => t.key === opts.key);
        if (i < 0) {
          const zIndex = opts.zIndex ?? 99999 + prev.length;
          const entry: PillToastModel = {
            key: opts.key,
            mode: "pill",
            allowedRoutes,
            variant: opts.variant,
            message: opts.message,
            subtitle: opts.subtitle,
            multiple: opts.multiple ?? 1,
            horizontalInset,
            zIndex,
            durationMs,
            insertedAt: nextInsertedAt(),
            exiting: false,
          };
          const next = [...prev, entry];
          toastsRef.current = next;
          return next;
        }

        const nextToast: ToastModel = {
          ...mergeToast(prev[i]!, {
            mode: "pill",
            variant: opts.variant,
            message: opts.message,
            subtitle: opts.subtitle,
            allowedRoutes: opts.allowedRoutes,
            multiple: opts.multiple,
            horizontalInset,
            zIndex: opts.zIndex,
            durationMs,
          }),
          exiting: false,
        };
        const copy = [...prev];
        copy[i] = nextToast;
        toastsRef.current = copy;
        return copy;
      });

      queueMicrotask(() => {
        clearTimer(opts.key);
        registerDismissCallback(opts.key, opts.onDismissed);
        armTimer(opts.key, durationMs);
      });
      return opts.key;
    },
    [armTimer, clearTimer, nextInsertedAt, registerDismissCallback],
  );

  const showProgress = useCallback(
    (opts: ShowProgressToastOptions): ToastKey => {
      const existing = toastsRef.current.find((t) => t.key === opts.key);
      if (existing != null && !existing.exiting) {
        throw new ToastKeyCollisionError(opts.key);
      }
      const replacedExiting = existing?.exiting === true;
      const horizontalInset = opts.horizontalInset ?? TOAST_HORIZONTAL_INSET;
      const durationMs =
        opts.durationMs === undefined
          ? resolveDefaultDurationMs(opts.key)
          : opts.durationMs;
      const allowedRoutes =
        opts.allowedRoutes === undefined
          ? resolveDefaultAllowedRoutes(opts.key)
          : opts.allowedRoutes;
      if (replacedExiting) {
        clearTimer(opts.key);
      }
      setToasts((prev) => {
        if (!replacedExiting && prev.some((t) => t.key === opts.key)) {
          throw new ToastKeyCollisionError(opts.key);
        }
        const base = replacedExiting ? prev.filter((t) => t.key !== opts.key) : prev;
        if (base.some((t) => t.key === opts.key)) {
          throw new ToastKeyCollisionError(opts.key);
        }
        const zIndex = opts.zIndex ?? 99999 + base.length;
        const entry: ProgressToastModel = {
          key: opts.key,
          mode: "progress",
          allowedRoutes,
          progressKind: opts.progressKind,
          title: opts.title,
          progress: opts.progress ?? 0,
          multiple: opts.multiple ?? 1,
          horizontalInset,
          zIndex,
          durationMs,
          insertedAt: nextInsertedAt(),
          exiting: false,
        };
        const next = [...base, entry];
        toastsRef.current = next;
        return next;
      });
      if (replacedExiting) {
        flushDismissCallback(opts.key);
        releaseActionCallback(opts.key);
      }
      registerDismissCallback(opts.key, opts.onDismissed);
      armTimer(opts.key, durationMs);
      return opts.key;
    },
    [
      armTimer,
      clearTimer,
      flushDismissCallback,
      nextInsertedAt,
      registerDismissCallback,
      releaseActionCallback,
    ],
  );

  const upsertProgress = useCallback(
    (opts: ShowProgressToastOptions): ToastKey => {
      const horizontalInset = opts.horizontalInset ?? TOAST_HORIZONTAL_INSET;
      const durationMs =
        opts.durationMs === undefined
          ? resolveDefaultDurationMs(opts.key)
          : opts.durationMs;
      const allowedRoutes =
        opts.allowedRoutes === undefined
          ? resolveDefaultAllowedRoutes(opts.key)
          : opts.allowedRoutes;

      setToasts((prev) => {
        const i = prev.findIndex((t) => t.key === opts.key);
        if (i < 0) {
          const zIndex = opts.zIndex ?? 99999 + prev.length;
          const entry: ProgressToastModel = {
            key: opts.key,
            mode: "progress",
            allowedRoutes,
            progressKind: opts.progressKind,
            title: opts.title,
            progress: opts.progress ?? 0,
            multiple: opts.multiple ?? 1,
            horizontalInset,
            zIndex,
            durationMs,
            insertedAt: nextInsertedAt(),
            exiting: false,
          };
          const next = [...prev, entry];
          toastsRef.current = next;
          return next;
        }

        const nextToast: ToastModel = {
          ...mergeToast(prev[i]!, {
            mode: "progress",
            progressKind: opts.progressKind,
            title: opts.title,
            allowedRoutes: opts.allowedRoutes,
            progress: opts.progress,
            multiple: opts.multiple,
            horizontalInset,
            zIndex: opts.zIndex,
            durationMs,
          }),
          exiting: false,
        };
        const copy = [...prev];
        copy[i] = nextToast;
        toastsRef.current = copy;
        return copy;
      });

      queueMicrotask(() => {
        clearTimer(opts.key);
        registerDismissCallback(opts.key, opts.onDismissed);
        armTimer(opts.key, durationMs);
      });
      return opts.key;
    },
    [armTimer, clearTimer, nextInsertedAt, registerDismissCallback],
  );

  const updateToast = useCallback(
    (key: ToastKey, patch: ToastUpdate) => {
      let found = false;
      setToasts((prev) => {
        const i = prev.findIndex((t) => t.key === key);
        if (i < 0) {
          toastsRef.current = prev;
          return prev;
        }
        found = true;
        const next: ToastModel = { ...mergeToast(prev[i]!, patch), exiting: false };
        const copy = [...prev];
        copy[i] = next;
        queueMicrotask(() => {
          clearTimer(key);
          armTimer(key, next.durationMs);
        });
        toastsRef.current = copy;
        return copy;
      });
      if (!found) {
        throw new ToastKeyNotFoundError(key);
      }
    },
    [armTimer, clearTimer],
  );

  const incrementMultiple = useCallback(
    (key: ToastKey): number => {
      let found = false;
      let nextMultiple = 1;
      setToasts((prev) => {
        const i = prev.findIndex((t) => t.key === key);
        if (i < 0) {
          toastsRef.current = prev;
          return prev;
        }
        found = true;
        const current = prev[i]!;
        nextMultiple = Math.max(1, current.multiple + 1);
        const copy = [...prev];
        copy[i] = { ...current, multiple: nextMultiple };
        queueMicrotask(() => {
          clearTimer(key);
          armTimer(key, current.durationMs);
        });
        toastsRef.current = copy;
        return copy;
      });
      if (!found) {
        throw new ToastKeyNotFoundError(key);
      }
      return nextMultiple;
    },
    [armTimer, clearTimer],
  );

  const dismiss = useCallback(
    (key: ToastKey, options?: { immediate?: boolean }) => {
      if (options?.immediate === true) {
        clearTimer(key);
        finalizeRemoveToast(key);
        return;
      }
      beginExitToast(key);
    },
    [beginExitToast, clearTimer, finalizeRemoveToast],
  );

  const dismissUnallowedToasts = useCallback(
    (currentRoute: string) => {
      const pending = toastsRef.current
        .filter((t) => !routeAllowedByPatterns(currentRoute, t.allowedRoutes))
        .map((t) => t.key);
      if (pending.length === 0) return;
      pending.forEach((key) => beginExitToast(key));
    },
    [beginExitToast],
  );

  const dismissAll = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current.clear();
    setToasts((prev) => {
      if (prev.length === 0) {
        toastsRef.current = prev;
        return prev;
      }
      const next = prev.map((t) => ({ ...t, exiting: true }));
      toastsRef.current = next;
      return next;
    });
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toastCount: toasts.length,
      setToastStackTopPosition,
      showPill,
      upsertPill,
      showActionToast,
      upsertActionToast,
      showProgress,
      upsertProgress,
      updateToast,
      incrementMultiple,
      dismiss,
      dismissUnallowedToasts,
      dismissAll,
    }),
    [
      dismiss,
      dismissUnallowedToasts,
      dismissAll,
      incrementMultiple,
      setToastStackTopPosition,
      showActionToast,
      showPill,
      upsertActionToast,
      upsertPill,
      showProgress,
      upsertProgress,
      toasts.length,
      updateToast,
    ],
  );

  const layoutToasts = useMemo(
    () => applyGlobalToastLayout(toasts, stackAnchorY),
    [toasts, stackAnchorY],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={styles.host} pointerEvents="box-none">
        {layoutToasts.map((t) => {
          if (t.mode === "pill") {
            return (
              <Toast
                key={t.key}
                variant={t.variant}
                message={withMultipleSuffix(t.message, t.multiple)}
                subtitle={t.subtitle}
                top={t.top}
                horizontalInset={t.horizontalInset}
                zIndex={t.zIndex}
                exiting={t.exiting}
                fadeOutMs={SAVED_TOAST_FADE_OUT_MS}
                onExitComplete={() => finalizeRemoveToast(t.key)}
              />
            );
          }
          if (t.mode === "action") {
            return (
              <ActionToast
                key={t.key}
                message={withMultipleSuffix(t.message, t.multiple)}
                icon={t.icon}
                color={t.color}
                backgroundColor={t.backgroundColor}
                top={t.top}
                horizontalInset={t.horizontalInset}
                zIndex={t.zIndex}
                exiting={t.exiting}
                fadeOutMs={SAVED_TOAST_FADE_OUT_MS}
                onExitComplete={() => finalizeRemoveToast(t.key)}
                onPress={() => {
                  actionCallbacksRef.current.get(t.key)?.();
                }}
              />
            );
          }
          return (
            <ProgressToast
              key={t.key}
              kind={t.progressKind}
              title={withMultipleSuffix(t.title, t.multiple)}
              progress={t.progress}
              top={t.top}
              horizontalInset={t.horizontalInset}
              zIndex={t.zIndex}
              exiting={t.exiting}
              fadeOutMs={DOWNLOAD_TOAST_FADE_OUT_MS}
              onExitComplete={() => finalizeRemoveToast(t.key)}
            />
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
  },
});
