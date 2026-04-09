import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

export type DownloadButtonProps = {
  isDownloaded: boolean;
  downloading: boolean;
  downloadPhase: number;
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
  downloadPhase,
  downloadPhaseProgress,
  onDownloadPress,
  onRemovePress,
}: DownloadButtonProps) {
  const showRemove = isDownloaded && onRemovePress != null;
  const phaseForLabel = Math.max(1, Math.min(4, downloadPhase));
  const progress01 = Math.max(0, Math.min(1, downloadPhaseProgress));
  const progressSize = 18;
  const progressStroke = 2.25;
  const progressRadius = (progressSize - progressStroke) / 2;
  const progressCircumference = 2 * Math.PI * progressRadius;
  const progressOffset = progressCircumference * (1 - progress01);
  const labelText = isDownloaded
    ? "Downloaded"
    : downloading
      ? `(${phaseForLabel}/4) Downloading`
      : "Download";

  return (
    <View style={styles.row}>
      {showRemove ? (
        <Pressable
          onPress={onRemovePress}
          style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}
          accessibilityLabel="Remove offline download"
          accessibilityRole="button"
        >
          <Image
            source={require("@/assets/images/icons/buttons/remove.png")}
            style={styles.removeIcon}
            contentFit="contain"
          />
        </Pressable>
      ) : null}
      <Pressable
        onPress={onDownloadPress}
        disabled={downloading || isDownloaded}
        style={({ pressed }) => [
          styles.pill,
          isDownloaded && styles.pillDone,
          pressed && !isDownloaded && styles.pillPressed,
        ]}
        accessibilityLabel={
          isDownloaded ? "Downloaded" : downloading ? "Downloading" : "Download for offline"
        }
        accessibilityRole="button"
      >
        <Text style={[styles.label, isDownloaded && styles.labelDone]}>
          {labelText}
        </Text>
        {downloading && !isDownloaded ? (
          <Svg width={progressSize} height={progressSize} style={styles.pillIcon}>
            <Circle
              cx={progressSize / 2}
              cy={progressSize / 2}
              r={progressRadius}
              stroke="rgba(15,23,42,0.25)"
              strokeWidth={progressStroke}
              fill="none"
            />
            <Circle
              cx={progressSize / 2}
              cy={progressSize / 2}
              r={progressRadius}
              stroke="#0f172a"
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
            style={[styles.pillIcon, isDownloaded && styles.pillIconDone]}
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
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  pillDone: {
    backgroundColor: "#15803d",
    borderWidth: 0,
    shadowColor: "#000",
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
    color: "#0f172a",
  },
  labelDone: {
    color: "#fff",
  },
  pillIcon: {
    width: 18,
    height: 18,
  },
  pillIconDone: {
    tintColor: "#fff",
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  removeButtonPressed: {
    opacity: 0.9,
  },
  removeIcon: {
    width: 20,
    height: 20,
  },
});
