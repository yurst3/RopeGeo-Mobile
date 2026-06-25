import { Linking, Platform } from "react-native";

const IOS_GOOGLE_MAPS_APP_STORE =
  "https://apps.apple.com/app/google-maps/id585027354";
const ANDROID_GOOGLE_MAPS_PLAY =
  "market://details?id=com.google.android.apps.maps";
const ANDROID_GOOGLE_MAPS_PLAY_HTTPS =
  "https://play.google.com/store/apps/details?id=com.google.android.apps.maps";

/** Opens Apple Maps at the given WGS84 point (http://maps.apple.com on all platforms). */
export async function openAppleMaps(lat: number, lon: number): Promise<void> {
  const url = `http://maps.apple.com/?ll=${lat},${lon}&q=Location`;
  try {
    await Linking.openURL(url);
  } catch {
    // No reliable store fallback for Apple Maps.
  }
}

/**
 * Opens Google Maps (app URL when possible), then Play/App Store if linking fails.
 */
export async function openGoogleMaps(lat: number, lon: number): Promise<void> {
  const primary =
    Platform.OS === "ios"
      ? `comgooglemaps://?q=${lat},${lon}&center=${lat},${lon}&zoom=14`
      : `geo:${lat},${lon}?q=${lat},${lon}`;

  try {
    await Linking.openURL(primary);
    return;
  } catch {
    // try fallbacks below
  }

  const web = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  try {
    await Linking.openURL(web);
    return;
  } catch {
    // try store
  }

  try {
    await Linking.openURL(
      Platform.OS === "ios"
        ? IOS_GOOGLE_MAPS_APP_STORE
        : ANDROID_GOOGLE_MAPS_PLAY,
    );
  } catch {
    if (Platform.OS === "android") {
      try {
        await Linking.openURL(ANDROID_GOOGLE_MAPS_PLAY_HTTPS);
      } catch {
        /* ignore */
      }
    }
  }
}
