import { DownloadButton } from "@/components/buttons/nonstandard/DownloadButton";
import { ExternalLinkButton } from "@/components/buttons/standard/ExternalLinkButton";
import { StyleSheet, View } from "react-native";

/** Seam row height (matches {@link RegionSeamButtons}). */
export const PAGE_SEAM_FLOAT_HEIGHT = 48;
/** How far above the card top the button row sits (matches original `top: -64`). */
export const PAGE_SEAM_FLOAT_OFFSET = 64;

export type PageSeamButtonsProps = {
  url: string;
  mapExpanded: boolean;
  isDownloaded: boolean;
  downloading: boolean;
  downloadDisplayStep: number;
  downloadDisplayTotal: number;
  downloadPhaseProgress: number;
  onDownloadPress: () => void;
  onRemoveDownloadPress: () => void;
};

/**
 * Ropewiki / download controls at the banner–card seam.
 * Anchored on {@link PageContent}'s `cardWrapper` so scroll position stays in sync without `scrollY`.
 */
export function PageSeamButtons({
  url,
  mapExpanded,
  isDownloaded,
  downloading,
  downloadDisplayStep,
  downloadDisplayTotal,
  downloadPhaseProgress,
  onDownloadPress,
  onRemoveDownloadPress,
}: PageSeamButtonsProps) {
  if (mapExpanded) return null;

  return (
    <View pointerEvents="box-none" style={styles.row}>
      <ExternalLinkButton
        icon={require("@/assets/images/icons/ropewiki.png")}
        link={url}
        accessibilityLabel="Open on RopeWiki"
      />
      <DownloadButton
        isDownloaded={isDownloaded}
        downloading={downloading}
        downloadDisplayStep={downloadDisplayStep}
        downloadDisplayTotal={downloadDisplayTotal}
        downloadPhaseProgress={downloadPhaseProgress}
        onDownloadPress={onDownloadPress}
        onRemovePress={onRemoveDownloadPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
});
