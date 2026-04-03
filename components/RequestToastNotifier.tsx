import { useAppToast } from "@/components/toast";
import { useEffect, useRef } from "react";

export type RequestToastNotifierProps<T> = {
  /** True while the request is in flight. Resets success/error toast state when it becomes true. */
  loading: boolean;
  /** Response data when the request succeeds. Used only to decide when to show the success toast. */
  data: T | null;
  /** Error when the request fails. Shown as an error toast. */
  errors: Error | null;
  /**
   * Message for the success toast (shown as subtitle under “Success”). If a function, it receives the loaded data.
   * Omit or pass undefined to skip the success toast.
   */
  successMessage?: string | ((data: T) => string);
};

/**
 * Shows a success toast when a request finishes with data and an error toast when it fails.
 * Toasts are shown at most once per "request" (resets when loading becomes true).
 * Use on any screen that has async loading state (must be under {@link AppToastProvider}).
 */
export function RequestToastNotifier<T>({
  loading,
  data,
  errors,
  successMessage,
}: RequestToastNotifierProps<T>) {
  const showToast = useAppToast();
  const hasToastedSuccess = useRef(false);
  const hasToastedError = useRef(false);

  if (loading) {
    hasToastedSuccess.current = false;
    hasToastedError.current = false;
  }

  useEffect(() => {
    if (successMessage == null || loading || data == null || hasToastedSuccess.current) {
      return;
    }
    hasToastedSuccess.current = true;
    const subtitle =
      typeof successMessage === "function" ? successMessage(data) : successMessage;
    showToast({
      variant: "success",
      message: "Success",
      subtitle,
    });
  }, [loading, data, successMessage, showToast]);

  useEffect(() => {
    if (errors == null || hasToastedError.current) {
      return;
    }
    hasToastedError.current = true;
    showToast({
      variant: "error",
      message: "Error",
      subtitle: errors.message,
    });
  }, [errors, showToast]);

  return null;
}
