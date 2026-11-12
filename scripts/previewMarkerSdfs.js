#!/usr/bin/env node
/** One-off: renders SDF markers the way Mapbox tints them (fill + 1pt halo) into /tmp for review. */
const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const SDF_DIR = path.join(__dirname, "..", "assets", "images", "icons", "markers", "sdf");
const NAMES = ["markerSdf", "markerDownSdf", "markerCameraSdf", "markerParkingSdf", "markerCampSdf", "markerWaterfallSdf", "markerSwimSdf", "markerQuestionSdf"];
const UPSCALE = 4;
const EDGE = 192;
// 1pt halo at iconSize 0.4 is 2.5 image px; one px of distance is 255 / 8 alpha.
const HALO_EDGE = EDGE - 2.5 * (255 / 8);

const images = NAMES.map((n) => PNG.sync.read(fs.readFileSync(path.join(SDF_DIR, `${n}.png`))));
const w = images[0].width * UPSCALE;
const out = new PNG({ width: w * images.length, height: w });
images.forEach((img, k) => {
  for (let y = 0; y < w; y++) {
    for (let x = 0; x < w; x++) {
      const a = img.data[(Math.floor(y / UPSCALE) * img.width + Math.floor(x / UPSCALE)) * 4 + 3];
      const color = a >= EDGE ? [236, 72, 153] : a >= HALO_EDGE ? [255, 255, 255] : [40, 44, 60];
      const o = (y * out.width + k * w + x) * 4;
      out.data.set([...color, 255], o);
    }
  }
});
fs.writeFileSync("/tmp/marker-sdf-preview.png", PNG.sync.write(out));
console.log("/tmp/marker-sdf-preview.png");
