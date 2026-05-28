const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("@expo/config-plugins");
const {
  MAPBOX_NATIVE_MARKER_ASSETS,
  MARKERS_SOURCE_DIR,
} = require("./mapboxNativeMarkerAssets");

/**
 * Copies route marker PNGs into iOS Images.xcassets and Android res/drawable so
 * @rnmapbox/maps `Images#nativeAssetImages` can load them without Metro URIs.
 */
function withMapboxNativeMarkerImages(config) {
  config = withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const { projectRoot, platformProjectRoot, projectName } = cfg.modRequest;
      const xcassetsRoot = path.join(
        platformProjectRoot,
        projectName,
        "Images.xcassets",
      );

      for (const { name, filename } of MAPBOX_NATIVE_MARKER_ASSETS) {
        const sourcePath = path.join(projectRoot, MARKERS_SOURCE_DIR, filename);
        if (!fs.existsSync(sourcePath)) {
          throw new Error(
            `[withMapboxNativeMarkerImages] Missing source asset: ${sourcePath}`,
          );
        }

        const imagesetDir = path.join(xcassetsRoot, `${name}.imageset`);
        fs.mkdirSync(imagesetDir, { recursive: true });

        const destFilename = `${name}.png`;
        fs.copyFileSync(sourcePath, path.join(imagesetDir, destFilename));

        const contents = {
          images: [
            {
              filename: destFilename,
              idiom: "universal",
              scale: "1x",
            },
          ],
          info: { version: 1, author: "expo" },
        };
        fs.writeFileSync(
          path.join(imagesetDir, "Contents.json"),
          `${JSON.stringify(contents, null, 2)}\n`,
        );
      }

      return cfg;
    },
  ]);

  config = withDangerousMod(config, [
    "android",
    async (cfg) => {
      const { projectRoot, platformProjectRoot } = cfg.modRequest;
      const drawableDir = path.join(
        platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
        "drawable",
      );
      fs.mkdirSync(drawableDir, { recursive: true });

      for (const { name, filename } of MAPBOX_NATIVE_MARKER_ASSETS) {
        const sourcePath = path.join(projectRoot, MARKERS_SOURCE_DIR, filename);
        if (!fs.existsSync(sourcePath)) {
          throw new Error(
            `[withMapboxNativeMarkerImages] Missing source asset: ${sourcePath}`,
          );
        }

        fs.copyFileSync(
          sourcePath,
          path.join(drawableDir, `${name}.png`),
        );
      }

      return cfg;
    },
  ]);

  return config;
}

module.exports = withMapboxNativeMarkerImages;
