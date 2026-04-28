import { Camera } from "@rnmapbox/maps";
import type { ComponentRef } from "react";
import { useCallback, useRef, useState } from "react";

type Bounds = { north: number; south: number; east: number; west: number };
type Padding = { paddingTop: number; paddingBottom: number; paddingLeft: number; paddingRight: number };

export function useMiniMapCamera({
  expanded,
  initialHomeCenter,
}: {
  expanded: boolean;
  initialHomeCenter?: [number, number];
}) {
  const cameraRef = useRef<ComponentRef<typeof Camera>>(null);
  const homeCenterRef = useRef<[number, number] | undefined>(initialHomeCenter);
  const homeZoomRef = useRef(0);
  const captureHomeRef = useRef(false);
  const pitchRef = useRef(0);
  const headingRef = useRef(0);
  const cameraCenterRef = useRef<[number, number] | undefined>(undefined);
  const cameraZoomRef = useRef<number | undefined>(undefined);
  const [compassVisible, setCompassVisible] = useState(false);
  const [positionButtonVisible, setPositionButtonVisible] = useState(false);

  const expandedRef = useRef(expanded);
  expandedRef.current = expanded;

  const fitToBounds = useCallback(
    (bounds: Bounds, padding: Padding, duration = 300) => {
      cameraRef.current?.setCamera({
        type: "CameraStop",
        bounds: {
          ne: [bounds.east, bounds.north],
          sw: [bounds.west, bounds.south],
          ...padding,
        },
        animationDuration: duration,
      });
    },
    []
  );

  const resetPitchAndHeading = useCallback(() => {
    cameraRef.current?.setCamera({ pitch: 0, heading: 0, animationDuration: 300 });
  }, []);

  const captureHome = useCallback(() => {
    captureHomeRef.current = true;
  }, []);

  const onCameraChanged = useCallback(
    (state: { properties: { pitch: number; heading: number; center: unknown; zoom: number } }) => {
      if (!expandedRef.current) return;
      const { pitch: p, heading: h, center, zoom } = state.properties;
      pitchRef.current = p;
      headingRef.current = h;
      const c = center as [number, number];
      cameraCenterRef.current = c;
      cameraZoomRef.current = zoom;
      if (captureHomeRef.current && c != null && zoom != null) {
        homeCenterRef.current = c;
        homeZoomRef.current = zoom;
        captureHomeRef.current = false;
      }
      const newCompass = Math.abs(p) > 0.5 || Math.abs(h) > 0.5;
      setCompassVisible((prev) => (prev !== newCompass ? newCompass : prev));
      const home = homeCenterRef.current;
      const homeZ = homeZoomRef.current;
      const newPos =
        home != null &&
        c != null &&
        zoom != null &&
        (Math.abs(c[0] - home[0]) > 1e-5 ||
          Math.abs(c[1] - home[1]) > 1e-5 ||
          Math.abs(zoom - homeZ) > 0.01);
      setPositionButtonVisible((prev) => (prev !== newPos ? newPos : prev));
    },
    []
  );

  return {
    cameraRef,
    fitToBounds,
    resetPitchAndHeading,
    captureHome,
    onCameraChanged,
    compassVisible,
    positionButtonVisible,
  };
}
