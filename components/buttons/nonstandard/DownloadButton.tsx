import { RemoveDownloadButton } from "@/components/buttons/standard/RemoveDownloadButton";
import { DOWNLOAD_BUTTON_KEY } from "@/constants/buttons";
import type { DownloadButtonColors } from "@/constants/colors/types";
import { useColorTheme } from "@/context/ColorThemeContext";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

export type DownloadButtonProps = {
  isDownloaded: boolean;
  downloading: boolean;
  /** 1-based visible step; 0 while queued before the first progress tick. */
  downloadDisplayStep: number;
  /** Total visible steps; 0 while queued. */
  downloadDisplayTotal: number;
  downloadPhaseProgress: number;
  onDownloadPress: () => void;
  /** Shown beside the pill when `isDownloaded` is true. Omit to hide remove. */
  onRemovePress?: () => void;
};

/**
 * Offline download pill (Download / Downloaded) plus optional remove control.
 * Parent is responsible for absolute positioning on the page.
 */
export function DownloadButton({
  isDownloaded,
  downloading,
  downloadDisplayStep,
  downloadDisplayTotal,
  downloadPhaseProgress,
  onDownloadPress,
  onRemovePress,
}: DownloadButtonProps) {
  const colors = useColorTheme().button.nonstandard[
    DOWNLOAD_BUTTON_KEY
  ] as DownloadButtonColors;
  const {
    background,
    downloadCompleteBackground,
    icon,
    downloadCompleteIcon,
    inProgressBackground,
    inProgressSolid,
    shadowColor,
  } = colors;

  const showRemove = isDownloaded && onRemovePress != null;
  const progress01 = Math.max(0, Math.min(1, downloadPhaseProgress));
  const stepForLabel =
    downloadDisplayTotal > 0
      ? Math.max(1, Math.min(downloadDisplayTotal, downloadDisplayStep || 1))
      : null;
  const progressSize = 18;
  const progressStroke = 2.25;
  const progressRadius = (progressSize - progressStroke) / 2;
  const progressCircumference = 2 * Math.PI * progressRadius;
  const progressOffset = progressCircumference * (1 - progress01);
  const labelText = isDownloaded
    ? "Downloaded"
    : downloading
      ? stepForLabel != null
        ? `(${stepForLabel}/${downloadDisplayTotal}) Downloading`
        : "Downloading"
      : "Download";

  const pillBackground = isDownloaded ? downloadCompleteBackground : background;
  const labelColor = isDownloaded ? downloadCompleteIcon : icon;

  return (
    <View style={styles.row}>
      {showRemove ? <RemoveDownloadButton onPress={onRemovePress} /> : null}
      <Pressable
        onPress={onDownloadPress}
        disabled={downloading || isDownloaded}
        style={({ pressed }) => [
          styles.pill,
          { backgroundColor: pillBackground, shadowColor },
          pressed && !isDownloaded && styles.pillPressed,
        ]}
        accessibilityLabel={
          isDownloaded ? "Downloaded" : downloading ? "Downloading" : "Download for offline"
        }
        accessibilityRole="button"
      >
        <Text style={[styles.label, { color: labelColor }]}>{labelText}</Text>
        {downloading && !isDownloaded ? (
          <Svg width={progressSize} height={progressSize} style={styles.pillIcon}>
            <Circle
              cx={progressSize / 2}
              cy={progressSize / 2}
              r={progressRadius}
              stroke={inProgressBackground}
              strokeWidth={progressStroke}
              fill="none"
            />
            <Circle
              cx={progressSize / 2}
              cy={progressSize / 2}
              r={progressRadius}
              stroke={inProgressSolid}
              strokeWidth={progressStroke}
              fill="none"
              strokeDasharray={progressCircumference}
              strokeDashoffset={progressOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${progressSize / 2} ${progressSize / 2})`}
            />
          </Svg>
        ) : (
          <Image
            source={
              isDownloaded
                ? require("@/assets/images/icons/buttons/downloaded.png")
                : require("@/assets/images/icons/buttons/download.png")
            }
            style={styles.pillIcon}
            tintColor={isDownloaded ? downloadCompleteIcon : icon}
            contentFit="contain"
          />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  pillPressed: {
    opacity: 0.92,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
  pillIcon: {
    width: 18,
    height: 18,
  },
});
