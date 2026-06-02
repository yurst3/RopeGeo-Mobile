# RopeGeo Mobile

## Releases (EAS Update vs build and submit)

Production releases use two GitHub Actions workflows with **mutually exclusive** triggers on push to `main` — only one runs per commit.

| Workflow | When it runs | What it does |
|----------|----------------|--------------|
| **Update** (`.github/workflows/update.yml`) | Push to `main` that only changes app source (JS/TS, most assets, tests, etc.) | `eas update` → OTA bundle on the `production` channel |
| **Build and Submit** (`.github/workflows/build-and-submit.yml`) | Push to `main` that touches native/build config (see paths in the workflow), push of a `v*` tag, or **manual** run | `eas build` + `eas submit` per platform (iOS always; Android when enabled) |

If a single commit changes both app source and native config (e.g. `app.json` and a screen), **only Build and Submit** runs. OTA updates require a store build that was compiled with `expo-updates` and the same `runtimeVersion` as `expo.version` in `app.json`.

### Use **Update** (OTA) for

- Bug fixes and UI changes in TypeScript/React
- New images and assets loaded via `require()` / Metro (not native Mapbox marker assets under `assets/images/icons/markers/`)
- Logic that does not need new native modules or permissions

Users on a compatible store build receive the update on next app launch (no App Store / Play review).

### Use **Build and Submit** for

- First store release, or bumping `expo.version` in `app.json` (new `runtimeVersion` for OTA)
- Changes to `package.json` / `package-lock.json`, `app.json`, `app.config.js`, `eas.json`, or `plugins/`
- Native Mapbox route marker images (`assets/images/icons/markers/`)
- New or upgraded packages with native code, permissions, icons, or splash screen

After a new store build ships, resume using **Update** for JS-only changes on that version.

### Manual release

Run **Build and Submit** from the Actions tab (`workflow_dispatch`) when you want a store release without changing the path-filtered files (e.g. before enabling OTA on an existing binary).

### Android submit

Set `SUBMIT_ANDROID: 'true'` in `build-and-submit.yml` after the Google Play service account is configured in EAS.

### Local commands

```bash
eas update --channel production          # same as Update workflow
eas build --platform ios --profile production
eas submit --platform ios --profile production --latest
```

Requires `EXPO_TOKEN` locally or `eas login`. Mapbox and other secrets are configured in the Expo project.

## App routes

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/(tabs)/explore` (explore tab). |
| `/explore` | Explore tab: map, route markers, search bar; tapping a route shows a preview. |
| `/explore/search` | Full-screen search; results are page and region previews. |
| `/explore/[id]/page` | Page detail screen. Requires query param `source` (PageDataSource). Route type is read from the fetched page view model. |
| `/explore/[id]/region` | Region detail screen. Requires query param `source` (PageDataSource). Renders e.g. Ropewiki region when `source=ropewiki`. |
| `/explore/shuttle-info` | Info screen for shuttle requirement badges; optional `highlightedShuttle` param. |
| `/explore/permit-info` | Info screen for permit status badges. |
| `/explore/risk-info` | Info screen for risk ratings. |
| `/explore/technical-info` | Info screen for technical difficulty ratings. |
| `/explore/water-info` | Info screen for water difficulty ratings. |
| `/explore/time-info` | Info screen for time ratings. |
| `/explore/vehicle-info` | Info screen for vehicle type. |

## Mapbox maps (iOS / Android)

This app uses [@rnmapbox/maps](https://rnmapbox.github.io/docs/install) with Expo. It **cannot run in Expo Go** because it uses custom native code.

1. **Generate native projects** (required before running on device/simulator):
   ```bash
   npx expo prebuild --clean
   ```
   If you see **`pod install` failed** / **spawn pod ENOENT**, the CocoaPods CLI wasn't on the PATH of the process Expo used. Prebuild still succeeded. If `pod` is not found in a new terminal either, add the Ruby gem executables directory to your PATH (one-time), then run `pod install`:
   ```bash
   echo 'export PATH="$(ruby -e '\''puts Gem.bindir'\''):$PATH"' >> ~/.zshrc
   source ~/.zshrc
   cd ios && pod install
   ```
2. **Mapbox access token:** Get a token from [Mapbox](https://account.mapbox.com/access-tokens/) and add it per [@rnmapbox/maps credentials](https://rnmapbox.github.io/docs/install) (e.g. `.mapbox` in project root for iOS, or your chosen method). Without a token, the map may not load.
   - Token changes are applied to native iOS/Android config during prebuild. If you update `.mapbox` (or token env vars), rerun:
   ```bash
   npx expo prebuild --clean
   ```

After prebuild (and `pod install` if needed), run **iOS** with `npx expo run:ios` and **Android** with `npx expo run:android` (development builds).

## Troubleshooting

### Android: "Unable to locate a Java Runtime" when running `npm run android`

Gradle needs a **JDK** on the machine that runs `expo run:android`. If macOS cannot find one, the build fails with a message like *The operation couldn't be completed. Unable to locate a Java Runtime* (and `gradlew ... exited with non-zero code: 1`).

**macOS (Homebrew):** Install OpenJDK and point your shell at it (adjust the version if you installed a different one):

```bash
brew install openjdk@17
export JAVA_HOME="$(brew --prefix openjdk@17)/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
java -version
```

Add the `export` lines to `~/.zshrc` (or your shell profile) if you want this to persist. Then run `npm run android` again from this directory.

**Windows and Linux:** The Homebrew steps above are **macOS-specific**; they will not apply on Windows. Install a supported JDK (for example [Eclipse Temurin](https://adoptium.net/) 17 or 21), set the `JAVA_HOME` environment variable to the JDK installation root (the folder that contains `bin/java`), ensure `%JAVA_HOME%\bin` is on `PATH`, open a new terminal, and retry the Android build. Exact steps depend on your JDK installer and shell.
