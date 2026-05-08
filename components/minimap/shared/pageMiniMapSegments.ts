import type { LegendItem } from "ropegeo-common/models";
import {
  Bounds,
  LegendFeatureType,
  LineLegendItem,
  PointLegendItem,
  PolygonLegendItem,
} from "ropegeo-common/models";

/** Resolve a legend row by map selection key (record key and/or {@link LegendItem.id}). */
export function legendItemForKey(
  legend: Record<string, LegendItem> | undefined,
  key: string,
): LegendItem | undefined {
  if (legend == null) return undefined;
  return legend[key] ?? Object.values(legend).find((x) => x.id === key);
}

function dedupeLineFeatureKey(f: GeoJSON.Feature<GeoJSON.LineString>): string {
  const c = f.geometry.coordinates;
  const a = c[0];
  const b = c[c.length - 1];
  const name = String((f.properties as Record<string, unknown> | null)?.name ?? "");
  return `${name}\0${a[0]},${a[1]}\0${b[0]},${b[1]}\0${c.length}`;
}

function dedupeLineFeatures(
  features: GeoJSON.Feature<GeoJSON.LineString>[],
): GeoJSON.Feature<GeoJSON.LineString>[] {
  const seen = new Set<string>();
  const out: GeoJSON.Feature<GeoJSON.LineString>[] = [];
  for (const f of features) {
    const k = dedupeLineFeatureKey(f);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(f);
  }
  return out;
}

/** True when `key` refers to a line row in the server-provided legend. */
export function isLineRowSelectionKey(
  key: string,
  legend: Record<string, LegendItem> | undefined,
): boolean {
  return legendItemForKey(legend, key)?.featureType === LegendFeatureType.Line;
}

/** Geographic bounds used to build a screen rect for `queryRenderedFeaturesInRect`. */
export function lineSelectionBounds(
  key: string,
  legend: Record<string, LegendItem> | undefined,
): Bounds | null {
  const item = legendItemForKey(legend, key);
  if (item?.featureType === LegendFeatureType.Line) {
    return boundsFromLegendItem(item);
  }
  return null;
}

export function lineSelectionStyle(
  key: string,
  legend: Record<string, LegendItem> | undefined,
): { stroke: string; strokeWidth: number } {
  const item = legendItemForKey(legend, key);
  if (item?.featureType === LegendFeatureType.Line) {
    const L = item as LineLegendItem;
    return {
      stroke: parseStrokeColor(L.strokeColor),
      strokeWidth: parseStrokeWidth(L.strokeWidth),
    };
  }
  return { stroke: DEFAULT_STROKE, strokeWidth: DEFAULT_STROKE_WIDTH };
}

/**
 * From rendered line features in a geographic rect, keep those belonging to the selected line.
 * Prefers `properties.legendId`, then {@link lineFeatureSelectionKey}, then legend line name match.
 */
export function filterRenderedLinesForSelectionKey(
  features: GeoJSON.Feature[],
  selectionKey: string,
  legend: Record<string, LegendItem> | undefined,
): GeoJSON.Feature<GeoJSON.LineString>[] {
  const lineStrings = features.filter(
    (f): f is GeoJSON.Feature<GeoJSON.LineString> => f.geometry?.type === "LineString",
  );

  const byLegendId = lineStrings.filter((f) => {
    const lid = String((f.properties as Record<string, unknown> | null)?.legendId ?? "").trim();
    return lid.length > 0 && lid === selectionKey;
  });
  if (byLegendId.length > 0) return dedupeLineFeatures(byLegendId);

  const byStableKey = lineStrings.filter((f) => lineFeatureSelectionKey(f) === selectionKey);
  if (byStableKey.length > 0) return dedupeLineFeatures(byStableKey);

  const leg = legendItemForKey(legend, selectionKey);
  if (leg?.featureType === LegendFeatureType.Line) {
    const name = leg.name.trim();
    if (name.length > 0) {
      const byName = lineStrings.filter(
        (f) => String((f.properties as Record<string, unknown> | null)?.name ?? "").trim() === name,
      );
      if (byName.length > 0) return dedupeLineFeatures(byName);
    }
  }

  return [];
}

const POINT_LEGEND_PAD = 0.0004;

function boundsFromPoint(lat: number, lon: number): Bounds {
  const p = POINT_LEGEND_PAD;
  return new Bounds(lat + p, lat - p, lon + p, lon - p);
}

/** Bounds used to fit the camera when a {@link LegendItem} is selected from the legend. */
export function boundsFromLegendItem(item: LegendItem): Bounds {
  switch (item.featureType) {
    case LegendFeatureType.Line: {
      const L = item as LineLegendItem;
      return L.bounds;
    }
    case LegendFeatureType.Point: {
      const P = item as PointLegendItem;
      return boundsFromPoint(P.coordinates.lat, P.coordinates.lon);
    }
    case LegendFeatureType.Polygon: {
      const G = item as PolygonLegendItem;
      return G.bounds;
    }
    default:
      return new Bounds(0, 0, 0, 0);
  }
}

const DEFAULT_STROKE = "#2563eb";
const DEFAULT_STROKE_WIDTH = 2.5;

export function segmentKeyFromLineFeature(f: GeoJSON.Feature<GeoJSON.LineString>): string {
  const coords = f.geometry.coordinates;
  const a = coords[0];
  const b = coords[coords.length - 1];
  const name = String((f.properties as Record<string, unknown> | null)?.name ?? "").trim();
  return `${name}\0${a[0].toFixed(5)},${a[1].toFixed(5)}\0${b[0].toFixed(5)},${b[1].toFixed(5)}`;
}

/** Stable id for selection: tile `legendId` when present, else geometry+name key. */
export function lineFeatureSelectionKey(f: GeoJSON.Feature<GeoJSON.LineString>): string {
  const raw = (f.properties as Record<string, unknown> | null)?.legendId;
  if (typeof raw === "string" && raw.trim().length > 0) return raw.trim();
  return segmentKeyFromLineFeature(f);
}

function expandHex3(s: string): string {
  if (s.length === 4 && s[0] === "#") {
    return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`.toLowerCase();
  }
  return s.toLowerCase();
}

export function parseStrokeColor(raw: unknown): string {
  if (typeof raw !== "string" || raw.trim() === "") return DEFAULT_STROKE;
  let s = raw.trim();
  if (s[0] !== "#") return DEFAULT_STROKE;
  if (/^#[0-9a-fA-F]{3}$/.test(s)) s = expandHex3(s);
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
  if (/^#[0-9a-fA-F]{8}$/.test(s)) return `#${s.slice(1, 7)}`.toLowerCase();
  return DEFAULT_STROKE;
}

export function parseStrokeWidth(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === "string") {
    const n = Number.parseFloat(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return DEFAULT_STROKE_WIDTH;
}

/** Relative luminance for sRGB hex `#rrggbb`; used to pick black vs white halo. */
export function contrastHaloColor(strokeHex: string): "#ffffff" | "#000000" {
  const hex = strokeHex.trim();
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return "#ffffff";
  const n = Number.parseInt(m[1], 16);
  const r = (n >> 16) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.45 ? "#000000" : "#ffffff";
}

export function boundsFromPositions(coords: GeoJSON.Position[]): Bounds | null {
  if (coords.length === 0) return null;
  let north = -90;
  let south = 90;
  let east = -180;
  let west = 180;
  for (const c of coords) {
    const lng = c[0];
    const lat = c[1];
    if (typeof lng !== "number" || typeof lat !== "number") continue;
    north = Math.max(north, lat);
    south = Math.min(south, lat);
    east = Math.max(east, lng);
    west = Math.min(west, lng);
  }
  return new Bounds(north, south, east, west);
}
