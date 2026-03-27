import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

export type MiniDownloadButtonProps = {
  isDownloaded: boolean;
  downloading: boolean;
  /** 0–1 progress within the current download phase. */
  downloadPhaseProgress: number;
  onDownloadPress: () => void;
  /** Long-press on the downloaded icon to remove the offline bundle. */
  onRemovePress?: () => void;
};

const PROGRESS_SIZE = 18;
const PROGRESS_STROKE = 2.25;
const HIT_SIZE = 36;

/**
 * Icon-only offline download control (download / in-progress ring / downloaded).
 * No label text; suitable for dense list rows.
 */
export function MiniDownloadButton({
  isDownloaded,
  downloading,
  downloadPhaseProgress,
  onDownloadPress,
  onRemovePress,
}: MiniDownloadButtonProps) {
  const progress01 = Math.max(0, Math.min(1, downloadPhaseProgress));
  const progressRadius = (PROGRESS_SIZE - PROGRESS_STROKE) / 2;
  const progressCircumference = 2 * Math.PI * progressRadius;
  const progressOffset = progressCircumference * (1 - progress01);

  const showProgress = downloading && !isDownloaded;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable
        onPress={() => {
          if (isDownloaded || downloading) return;
          onDownloadPress();
        }}
        onLongPress={() => {
          if (isDownloaded && onRemovePress != null) {
            onRemovePress();
          }
        }}
        disabled={downloading}
        style={({ pressed }) => [
          styles.hit,
          pressed && !isDownloaded && !downloading && styles.hitPressed,
          isDownloaded && styles.hitDone,
        ]}
        accessibilityLabel={
          isDownloaded
            ? "Downloaded for offline"
            : downloading
              ? "Downloading for offline"
              : "Download for offline"
        }
        accessibilityHint={
          isDownloaded && onRemovePress != null
            ? "Long press to remove offline download"
            : undefined
        }
        accessibilityRole="button"
      >
        {showProgress ? (
          <Svg width={PROGRESS_SIZE} height={PROGRESS_SIZE}>
            <Circle
              cx={PROGRESS_SIZE / 2}
              cy={PROGRESS_SIZE / 2}
              r={progressRadius}
              stroke="rgba(15,23,42,0.2)"
              strokeWidth={PROGRESS_STROKE}
              fill="none"
            />
            <Circle
              cx={PROGRESS_SIZE / 2}
              cy={PROGRESS_SIZE / 2}
              r={progressRadius}
              stroke="#0f172a"
              strokeWidth={PROGRESS_STROKE}
              fill="none"
              strokeDasharray={progressCircumference}
              strokeDashoffset={progressOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${PROGRESS_SIZE / 2} ${PROGRESS_SIZE / 2})`}
            />
          </Svg>
        ) : (
          <Image
            source={
              isDownloaded
                ? require("@/assets/images/icons/downloaded.png")
                : require("@/assets/images/icons/download.png")
            }
            style={[styles.icon, isDownloaded && styles.iconDone]}
            contentFit="contain"
          />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "flex-end",
  },
  hit: {
    width: HIT_SIZE,
    height: HIT_SIZE,
    borderRadius: HIT_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  hitDone: {
    backgroundColor: "#15803d",
    borderWidth: 0,
  },
  hitPressed: {
    opacity: 0.9,
  },
  icon: {
    width: 18,
    height: 18,
  },
  iconDone: {
    tintColor: "#fff",
  },
});
