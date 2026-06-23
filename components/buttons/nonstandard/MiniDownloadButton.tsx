import { MINI_DOWNLOAD_BUTTON_KEY } from "@/constants/buttons";
import type { MiniDownloadButtonColors } from "@/constants/colors/types";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useText } from "@/context/TextContext";
import { useUiScale } from "@/context/UIScaleContext";
import {
  useResolvedButtonBackgroundScale,
  useResolvedButtonIconScale,
} from "@/utils/resolvers";
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
  const colors = useColorTheme().button.nonstandard[
    MINI_DOWNLOAD_BUTTON_KEY
  ] as MiniDownloadButtonColors;
  const uiScale = useUiScale();
  const buttonSpec = uiScale.preview.buttons.download;
  const backgroundScale = useResolvedButtonBackgroundScale(buttonSpec);
  const profileIconScale = useResolvedButtonIconScale(buttonSpec);
  const hitSize = Math.round(HIT_SIZE * backgroundScale);
  const progressSize = Math.round(PROGRESS_SIZE * profileIconScale);
  const progressStroke = PROGRESS_STROKE * profileIconScale;
  const iconSize = Math.round(18 * profileIconScale);
  const {
    background,
    downloadCompleteBackground,
    icon,
    downloadCompleteIcon,
    inProgressBackground,
    inProgressSolid,
    shadowColor,
  } = colors;

  const progress01 = Math.max(0, Math.min(1, downloadPhaseProgress));
  const progressRadius = (progressSize - progressStroke) / 2;
  const progressCircumference = 2 * Math.PI * progressRadius;
  const progressOffset = progressCircumference * (1 - progress01);

  const showProgress = downloading && !isDownloaded;
  const hitBackground = isDownloaded ? downloadCompleteBackground : background;

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
          {
            backgroundColor: hitBackground,
            shadowColor,
            width: hitSize,
            height: hitSize,
            borderRadius: hitSize / 2,
          },
          pressed && !isDownloaded && !downloading && styles.hitPressed,
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
          <Svg width={progressSize} height={progressSize}>
            <Circle
              cx={progressSize / 2}
              cy={progressSize / 2}
              r={progressRadius}
              stroke={inProgressBackground}
              strokeWidth={PROGRESS_STROKE}
              fill="none"
            />
            <Circle
              cx={progressSize / 2}
              cy={progressSize / 2}
              r={progressRadius}
              stroke={inProgressSolid}
              strokeWidth={PROGRESS_STROKE}
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
            style={{ width: iconSize, height: iconSize }}
            tintColor={isDownloaded ? downloadCompleteIcon : icon}
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
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  hitPressed: {
    opacity: 0.9,
  },
});
