#!/usr/bin/env node
/**
 * One-off: writes assets/images/icons/buttons/lineSegment.png, a copy of addLineSegment.png with
 * its "+" removed (the record button draws a red square in that corner instead). The "+" sits
 * alone in the top-right corner, so clearing a box around it touches nothing else.
 *
 * Usage: node scripts/makeLineSegmentIcon.js
 */
const fs = require("fs");
const path = require("path");
// pngjs comes with the Expo toolchain; nothing in the app depends on it.
const { PNG } = require("pngjs");

const ICONS_DIR = path.join(__dirname, "..", "assets", "images", "icons", "buttons");
const SOURCE_PATH = path.join(ICONS_DIR, "addLineSegment.png");
const OUTPUT_PATH = path.join(ICONS_DIR, "lineSegment.png");

/** The "+" box on the 512px design canvas (see makeAddLineSegmentIcon.js), plus room for its antialiased edge. */
const DESIGN_SIZE = 512;
const CLEAR_BOX = { left: 316, top: 60, right: 452, bottom: 196 };

const icon = PNG.sync.read(fs.readFileSync(SOURCE_PATH));
const scale = icon.width / DESIGN_SIZE;
const [left, top, right, bottom] = [
  CLEAR_BOX.left,
  CLEAR_BOX.top,
  CLEAR_BOX.right,
  CLEAR_BOX.bottom,
].map((v) => Math.round(v * scale));

for (let y = Math.max(0, top); y < Math.min(icon.height, bottom); y++) {
  for (let x = Math.max(0, left); x < Math.min(icon.width, right); x++) {
    icon.data[(y * icon.width + x) * 4 + 3] = 0;
  }
}

fs.writeFileSync(OUTPUT_PATH, PNG.sync.write(icon));
console.log(`Wrote ${path.basename(OUTPUT_PATH)} (${icon.width}x${icon.height})`);
