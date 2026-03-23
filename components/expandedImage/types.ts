import type { ImageProps } from "expo-image";

/** Window rect from `measureInWindow` — expand animation anchor. */
export type ExpandedImageAnchorRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** One fullscreen page inside `ExpandedImageModal` (beta gallery or single banner). */
export type ExpandedImageGalleryPage = {
  /** Stable id for list keys and parent sync (e.g. `linkUrl + order`). */
  itemKey: string;
  fullUrl: NonNullable<ImageProps["source"]>;
  bannerUrl: string | null;
  captionHtml?: string | null;
};
