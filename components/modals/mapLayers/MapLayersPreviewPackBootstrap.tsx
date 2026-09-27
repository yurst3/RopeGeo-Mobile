import { useNetworkStatus } from "@/context/app/NetworkStatusContext";
import { ensureMapLayersPreviewPacks } from "@/utils/mapbox/mapLayersPreviewPacks";
import { useEffect } from "react";

/** Starts the one-time basemap preview download once the device is online. */
export function MapLayersPreviewPackBootstrap() {
  const { isOnline, networkState } = useNetworkStatus();
  const networkKnown = networkState != null;

  useEffect(() => {
    if (!networkKnown || !isOnline) return;
    void ensureMapLayersPreviewPacks();
  }, [isOnline, networkKnown]);

  return null;
}
