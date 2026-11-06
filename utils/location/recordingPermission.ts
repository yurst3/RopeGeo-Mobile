import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

/**
 * - `background`: can record with RopeGeo off screen ("Always" / "Allow all the time").
 * - `foregroundOnly`: location allowed only while the app is in use.
 * - `denied`: no location access.
 * - `undetermined`: not asked for recording access yet.
 */
export type RecordingPermission = "background" | "foregroundOnly" | "denied" | "undetermined";

/** Android can keep allowing background requests after a refusal, so remember that we asked. */
const BACKGROUND_REQUESTED_KEY = "ropegeo:recordingBackgroundPermissionRequested";

const listeners = new Set<() => void>();

function notifyPermissionChanged(): void {
  for (const listener of listeners) listener();
}

async function markBackgroundRequested(): Promise<void> {
  try {
    await AsyncStorage.setItem(BACKGROUND_REQUESTED_KEY, "1");
  } catch {
    /* only affects when the notice first appears */
  }
}

async function wasBackgroundRequested(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(BACKGROUND_REQUESTED_KEY)) === "1";
  } catch {
    return false;
  }
}

/** Current recording permission level, without prompting. */
export async function getRecordingPermission(): Promise<RecordingPermission> {
  const foreground = await Location.getForegroundPermissionsAsync();
  if (foreground.status === "undetermined") return "undetermined";
  if (!foreground.granted) return "denied";
  const background = await Location.getBackgroundPermissionsAsync();
  if (background.granted) return "background";
  if (background.canAskAgain && !(await wasBackgroundRequested())) return "undetermined";
  return "foregroundOnly";
}

/**
 * Asks for location access needed to record: foreground first, then background ("Always" on iOS,
 * "Allow all the time" on Android). iOS only shows its background prompt once per install.
 */
export async function requestRecordingPermission(): Promise<RecordingPermission> {
  try {
    const foreground = await Location.requestForegroundPermissionsAsync();
    if (!foreground.granted) return "denied";
    let background = await Location.getBackgroundPermissionsAsync();
    if (!background.granted && background.canAskAgain) {
      background = await Location.requestBackgroundPermissionsAsync();
      await markBackgroundRequested();
    }
    if (background.granted) return "background";
    await markBackgroundRequested();
    return "foregroundOnly";
  } catch {
    return "denied";
  } finally {
    notifyPermissionChanged();
  }
}

/** Recording permission level, refreshed after requests and whenever the app becomes active. */
export function useRecordingPermission(): RecordingPermission {
  const [permission, setPermission] = useState<RecordingPermission>("undetermined");

  const refresh = useCallback(() => {
    void getRecordingPermission()
      .then(setPermission)
      .catch(() => setPermission("undetermined"));
  }, []);

  useEffect(() => {
    refresh();
    listeners.add(refresh);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      listeners.delete(refresh);
      subscription.remove();
    };
  }, [refresh]);

  return permission;
}
