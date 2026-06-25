import { Asset } from "expo-asset";
import { useEffect, useState } from "react";
import { Image, type ImageSourcePropType } from "react-native";

function isDevServerUri(uri: string): boolean {
  return uri.startsWith("http://") || uri.startsWith("https://");
}

/**
 * Resolves a Metro `require()` image to a `file://` (or `asset://`) source that works offline.
 * Dev `http://localhost` URIs are replaced via `expo-asset` after `downloadAsync`.
 */
export function useBundledImageSource(
  moduleId: number,
): ImageSourcePropType | undefined {
  const [source, setSource] = useState<ImageSourcePropType | undefined>(() => {
    const resolved = Image.resolveAssetSource(moduleId);
    if (resolved?.uri && !isDevServerUri(resolved.uri)) {
      return resolved;
    }
    return undefined;
  });

  useEffect(() => {
    const resolved = Image.resolveAssetSource(moduleId);
    if (resolved?.uri && !isDevServerUri(resolved.uri)) {
      setSource(resolved);
      return;
    }

    let cancelled = false;
    void (async () => {
      const asset = Asset.fromModule(moduleId);
      await asset.downloadAsync();
      if (cancelled) return;
      const uri = asset.localUri ?? asset.uri;
      if (uri) {
        setSource({ uri });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  return source;
}
