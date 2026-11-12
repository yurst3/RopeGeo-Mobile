#!/usr/bin/env node
/** One-off: writes markers/pinSilhouette.png, marker.png with its center hole filled in. */
const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const MARKERS_DIR = path.join(__dirname, "..", "assets", "images", "icons", "markers");
const image = PNG.sync.read(fs.readFileSync(path.join(MARKERS_DIR, "marker.png")));
const { width, height, data } = image;
const open = (i) => data[i * 4 + 3] < 128;

// Transparent pixels reachable from the border are outside the pin; the rest are the hole.
const outside = new Uint8Array(width * height);
const stack = [];
for (let x = 0; x < width; x++) stack.push(x, (height - 1) * width + x);
for (let y = 0; y < height; y++) stack.push(y * width, y * width + width - 1);
while (stack.length > 0) {
  const i = stack.pop();
  if (outside[i] || !open(i)) continue;
  outside[i] = 1;
  const x = i % width;
  if (x > 0) stack.push(i - 1);
  if (x < width - 1) stack.push(i + 1);
  if (i >= width) stack.push(i - width);
  if (i < (height - 1) * width) stack.push(i + width);
}
for (let i = 0; i < width * height; i++) {
  if (outside[i]) continue;
  data.set([0, 0, 0, 255], i * 4);
}
fs.writeFileSync(path.join(MARKERS_DIR, "pinSilhouette.png"), PNG.sync.write(image));
console.log("markers/pinSilhouette.png");
