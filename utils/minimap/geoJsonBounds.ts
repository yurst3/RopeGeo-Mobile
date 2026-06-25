/**
 * Axis-aligned bounds for Mapbox `setCamera` / region fit helpers.
 * Returns null when there are no coordinates to bound.
 */
export function boundsFromFeatureCollection(
  fc: GeoJSON.FeatureCollection | null | undefined,
): { north: number; south: number; east: number; west: number } | null {
  if (fc == null || fc.features.length === 0) return null;
  let north = -90;
  let south = 90;
  let east = -180;
  let west = 180;
  let any = false;

  const visit = (pos: GeoJSON.Position) => {
    const [lng, lat] = pos;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
    any = true;
    north = Math.max(north, lat);
    south = Math.min(south, lat);
    east = Math.max(east, lng);
    west = Math.min(west, lng);
  };

  const walkCoords = (coords: unknown): void => {
    if (!Array.isArray(coords) || coords.length === 0) return;
    if (typeof coords[0] === "number") {
      visit(coords as GeoJSON.Position);
      return;
    }
    for (const c of coords as unknown[]) {
      walkCoords(c);
    }
  };

  const walkGeometry = (g: GeoJSON.Geometry | null | undefined) => {
    if (g == null) return;
    switch (g.type) {
      case "Point":
        walkCoords(g.coordinates);
        break;
      case "MultiPoint":
      case "LineString":
        walkCoords(g.coordinates);
        break;
      case "MultiLineString":
      case "Polygon":
        walkCoords(g.coordinates);
        break;
      case "MultiPolygon":
        walkCoords(g.coordinates);
        break;
      case "GeometryCollection":
        for (const part of g.geometries) {
          walkGeometry(part);
        }
        break;
      default:
        break;
    }
  };

  for (const f of fc.features) {
    walkGeometry(f.geometry ?? undefined);
  }

  if (!any || north < south || east < west) return null;
  return { north, south, east, west };
}
