#!/usr/bin/env node
/**
 * Generates the signed distance field (SDF) map marker images.
 *
 * Mapbox draws markers as SDF icons so they can be tinted (`iconColor`) and outlined
 * (`iconHaloColor` / `iconHaloWidth`). Halos need a real distance field around the shape, so this
 * converts every solid `marker*.png` in assets/images/icons/markers into `sdf/<name>Sdf.png`:
 * - The shape is drawn CONTENT_SIZE px wide, with PADDING px of room around it for the halo.
 * - Alpha is the distance to the shape's edge in Mapbox's glyph encoding: 192 (0.75) on the
 *   edge, rising inside and falling to 0 RADIUS * (1 - CUTOFF) px outside.
 *
 * Keep CONTENT_SIZE and PADDING in sync with ROUTE_MARKER_SDF_CONTENT_SIZE and
 * ROUTE_MARKER_SDF_PADDING in utils/explore/routeMarkerIcons.ts.
 *
 * Usage: node scripts/generateMarkerSdfs.js
 * Markers Mapbox loads natively (plugins/mapboxNativeMarkerAssets.js) are copied into the native
 * projects at prebuild, so rebuild the app after regenerating them.
 */
const fs = require("fs");
const path = require("path");
// pngjs comes with the Expo toolchain; nothing in the app depends on it.
const { PNG } = require("pngjs");

const MARKERS_DIR = path.join(__dirname, "..", "assets", "images", "icons", "markers");
const SDF_DIR = path.join(MARKERS_DIR, "sdf");

const CONTENT_SIZE = 64;
const PADDING = 8;
const RADIUS = 8;
const CUTOFF = 0.25;
const INF = 1e20;
/**
 * Markers whose symbol cut-out keeps showing the map through it. Every other marker's symbol is
 * filled with the halo color: the cut-out pixels are given a distance just outside the edge
 * (HOLE_DISTANCE output px), well inside the halo.
 */
const SYMBOL_CUTOUT_MARKERS = new Set([
  "marker.png",
  "markerUp.png",
  "markerDown.png",
  "markerCluster.png",
  "markerSelected.png",
]);
const HOLE_DISTANCE = 1;

/** Felzenszwalb & Huttenlocher squared distance transform along one row or column. */
function edt1d(grid, offset, stride, length, f, v, z) {
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  f[0] = grid[offset];
  for (let q = 1, k = 0, s = 0; q < length; q++) {
    f[q] = grid[offset + q * stride];
    const q2 = q * q;
    do {
      const r = v[k];
      s = (f[q] - f[r] + q2 - r * r) / (q - r) / 2;
    } while (s <= z[k] && --k > -1);
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  for (let q = 0, k = 0; q < length; q++) {
    while (z[k + 1] < q) k++;
    const r = v[k];
    const qr = q - r;
    grid[offset + q * stride] = f[r] + qr * qr;
  }
}

function edt(grid, width, height) {
  const n = Math.max(width, height);
  const f = new Float64Array(n);
  const v = new Uint16Array(n);
  const z = new Float64Array(n + 1);
  for (let x = 0; x < width; x++) edt1d(grid, x, width, height, f, v, z);
  for (let y = 0; y < height; y++) edt1d(grid, y * width, 1, width, f, v, z);
}

/**
 * Marks the mostly transparent pixels the shape encloses: those not connected to the image's
 * border through other mostly transparent pixels.
 */
function enclosedHoles(alphaAt, size) {
  const open = (i) => alphaAt(i) < 0.5;
  const outside = new Uint8Array(size * size);
  const stack = [];
  for (let k = 0; k < size; k++) {
    stack.push(k, (size - 1) * size + k, k * size, k * size + size - 1);
  }
  while (stack.length > 0) {
    const i = stack.pop();
    if (outside[i] || !open(i)) continue;
    outside[i] = 1;
    const x = i % size;
    const y = (i - x) / size;
    if (x > 0) stack.push(i - 1);
    if (x < size - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - size);
    if (y < size - 1) stack.push(i + size);
  }
  const holes = new Uint8Array(size * size);
  for (let i = 0; i < size * size; i++) holes[i] = open(i) && !outside[i] ? 1 : 0;
  return holes;
}

function generate(sourceName) {
  const source = PNG.sync.read(fs.readFileSync(path.join(MARKERS_DIR, sourceName)));
  if (source.width !== source.height || source.width % CONTENT_SIZE !== 0) {
    throw new Error(`${sourceName} must be square with a size divisible by ${CONTENT_SIZE}`);
  }
  // Distances are measured on the full-resolution source, padded to leave room for the falloff.
  const scale = source.width / CONTENT_SIZE;
  const pad = PADDING * scale;
  const size = source.width + pad * 2;
  const outer = new Float64Array(size * size);
  const inner = new Float64Array(size * size);
  const alphaAt = (i) => {
    const sx = (i % size) - pad;
    const sy = Math.floor(i / size) - pad;
    const inside = sx >= 0 && sy >= 0 && sx < source.width && sy < source.height;
    return inside ? source.data[(sy * source.width + sx) * 4 + 3] / 255 : 0;
  };
  const holes = SYMBOL_CUTOUT_MARKERS.has(sourceName) ? null : enclosedHoles(alphaAt, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const a = alphaAt(i);
      // Partly covered edge pixels start part of a pixel from the edge (as in @mapbox/tiny-sdf).
      outer[i] = a === 1 ? 0 : a === 0 ? INF : Math.max(0, 0.5 - a) ** 2;
      inner[i] = a === 1 ? INF : a === 0 ? 0 : Math.max(0, a - 0.5) ** 2;
    }
  }
  edt(outer, size, size);
  edt(inner, size, size);

  const outSize = CONTENT_SIZE + PADDING * 2;
  const out = new PNG({ width: outSize, height: outSize });
  for (let y = 0; y < outSize; y++) {
    for (let x = 0; x < outSize; x++) {
      // Average the signed distance (positive outside) over the source pixels this one covers.
      let sum = 0;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const i = (y * scale + dy) * size + (x * scale + dx);
          const signed = Math.sqrt(outer[i]) - Math.sqrt(inner[i]);
          sum += holes?.[i] ? Math.min(signed, HOLE_DISTANCE * scale) : signed;
        }
      }
      const distance = sum / (scale * scale) / scale;
      const alpha = Math.round(255 - 255 * (distance / RADIUS + CUTOFF));
      const o = (y * outSize + x) * 4;
      out.data[o] = 0;
      out.data[o + 1] = 0;
      out.data[o + 2] = 0;
      out.data[o + 3] = Math.max(0, Math.min(255, alpha));
    }
  }

  const outName = sourceName.replace(/\.png$/, "Sdf.png");
  fs.writeFileSync(path.join(SDF_DIR, outName), PNG.sync.write(out));
  console.log(`${sourceName} -> sdf/${outName}`);
}

fs.mkdirSync(SDF_DIR, { recursive: true });
const sources = fs
  .readdirSync(MARKERS_DIR)
  .filter((name) => /^marker.*\.png$/.test(name) && !name.endsWith("Sdf.png"))
  .sort();
for (const name of sources) generate(name);
