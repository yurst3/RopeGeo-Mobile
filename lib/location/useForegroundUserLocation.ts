import * as Location from "expo-location";
import { useEffect, useState } from "react";

/**
 * Watches foreground location while `enabled` is true. Requires foreground permission;
 * returns `undefined` when disabled, denied, or not yet resolved.
 */
export function useForegroundUserLocation(enabled: boolean): [number, number] | undefined {
  const [coord, setCoord] = useState<[number, number] | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      setCoord(undefined);
      return;
    }
    let mounted = true;
    let subscription: Location.LocationSubscription | null = null;

    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || !mounted) {
        return;
      }
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 1000,
          distanceInterval: 0,
        },
        (position) => {
          if (!mounted) return;
          setCoord([position.coords.longitude, position.coords.latitude]);
        },
      );
    };

    start().catch(() => {
      /* keep undefined */
    });

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, [enabled]);

  return coord;
}
