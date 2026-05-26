import type { ToastStyle } from "@/constants/colors/types";

export type ToastVariant = "pill" | "progress" | "action";

export type ToastArchetype = {
  /** Lower number = closer to stack anchor (higher on screen). */
  priority: number;
  /**
   * Whitelist of route patterns where this toast may render. Supports dynamic segments (e.g.
   * `/explore/[id]/region`). `null` means globally allowed.
   */
  allowedRoutes: string[] | null;
  /** Default duration; callers may override on creation/upsert/update. */
  durationMs: number | null;
  /** Preferred UI variant for this toast family. */
  variant: ToastVariant;
  /** Default semantic colors for this toast family. */
  style: ToastStyle;
};

export type ProgressToastKind = "progress" | "success" | "error";
