import type { MutableRefObject } from "react";

/** Imperative handle for minimap-specific retry (e.g. clear shell blocking so native map remounts). */
export type MiniMapHandle = {
  reload: () => void;
};

/** Ref each `MiniMap` leaf assigns its reload implementation to. */
export type MiniMapReloadRegisterRef = MutableRefObject<(() => void) | null>;
