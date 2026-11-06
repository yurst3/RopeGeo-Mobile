import { ConstantText } from "@/components/text/ConstantText";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedIconSizeScale } from "@/utils/theme/resolvers";
import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { MAP_FILE_IMPORT_FORMATS } from "ropegeo-common/models";

const UPLOAD_FILE_ICON = require("@/assets/images/icons/buttons/uploadFile.png");
const DESIGN_ICON_SIZE = 26;
const SUPPORTED_FORMATS = MAP_FILE_IMPORT_FORMATS.map((format) => `.${format}`).join(", ");

/**
 * Touch area under a trip report map for importing a map file into the block. While any upload
 * is in progress it's disabled and says so in place of the supported formats.
 */
export function UploadMapFileArea({
  onPress,
  disabled = false,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  const { text } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const iconSize = Math.round(DESIGN_ICON_SIZE * useResolvedIconSizeScale());

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.area, { opacity: pressed ? 0.6 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel="Upload a map file"
      accessibilityState={{ disabled }}
    >
      <View style={styles.titleRow}>
        <ConstantText
          size={uiScale.filter.text.title}
          typography={textStyle.filter.optionLabel}
          style={{ color: text.primary }}
        >
          Upload a map file
        </ConstantText>
        <Image
          source={UPLOAD_FILE_ICON}
          style={{ width: iconSize, height: iconSize, tintColor: text.primary }}
          contentFit="contain"
          accessibilityElementsHidden
        />
      </View>
      <ConstantText
        size={uiScale.filter.text.note}
        typography={textStyle.filter.optionLabel}
        style={[styles.formats, { color: disabled ? text.error : text.highlight }]}
      >
        {disabled ? "Map file upload in progress" : `Supported formats: ${SUPPORTED_FORMATS}`}
      </ConstantText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  area: {
    alignItems: "center",
    gap: 4,
    paddingTop: 20,
    paddingBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  formats: {
    textAlign: "center",
  },
});
