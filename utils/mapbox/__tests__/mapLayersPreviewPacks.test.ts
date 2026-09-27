import { MAP_LAYERS_PREVIEW_CENTER } from "@/constants/mapbox";
import {
  mapLayersPreviewPackBounds,
  mapLayersPreviewPackName,
} from "@/utils/mapbox/mapLayersPreviewPacks";

jest.mock("@rnmapbox/maps", () => ({
  offlineManager: {},
}));

describe("mapLayersPreviewPackBounds", () => {
  it("covers the preview center with northeast first", () => {
    const [ne, sw] = mapLayersPreviewPackBounds();
    const [lng, lat] = MAP_LAYERS_PREVIEW_CENTER;
    expect(ne[0]).toBeGreaterThan(lng);
    expect(ne[1]).toBeGreaterThan(lat);
    expect(sw[0]).toBeLessThan(lng);
    expect(sw[1]).toBeLessThan(lat);
  });
});

describe("mapLayersPreviewPackName", () => {
  it("includes the basemap and the style id", () => {
    expect(mapLayersPreviewPackName("standard")).toBe(
      "ropegeo-map-layers-preview-standard-cmt3184os002w01sk44ph6dl0",
    );
    expect(mapLayersPreviewPackName("satellite")).toBe(
      "ropegeo-map-layers-preview-satellite-cmt95nmi200au01sk8uul4i0o",
    );
  });
});
