import { ConstantText } from "@/components/text/ConstantText";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useFilterTheme } from "@/utils/filters/useFilterTheme";
import Slider from "@react-native-community/slider";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

export type RecordSettingSliderProps = {
  title: string;
  description: string;
  /** Number of discrete stops; the slider moves over indexes `0…stepCount - 1`. */
  stepCount: number;
  /** Stop matching the saved setting. */
  savedIndex: number;
  /** Value label shown beside the slider for a stop. */
  formatStep: (index: number) => string;
  /** Called once when the thumb is released. */
  onCommit: (index: number) => void;
};

/**
 * Titled, described slider over discrete stops for a recording setting. The value label follows
 * the thumb while dragging; the setting is committed on release, since saving restarts any
 * recording's location updates.
 */
export function RecordSettingSlider({
  title,
  description,
  stepCount,
  savedIndex,
  formatStep,
  onCommit,
}: RecordSettingSliderProps) {
  const { filter, sectionLabel, text } = useFilterTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const lastIndex = stepCount - 1;
  const [index, setIndex] = useState(savedIndex);

  useEffect(() => {
    setIndex(savedIndex);
  }, [savedIndex]);

  const clampIndex = (value: number) => Math.max(0, Math.min(lastIndex, Math.round(value)));

  return (
    <View>
      <ConstantText
        size={uiScale.filter.text.sectionTitle}
        typography={textStyle.filter.sectionTitle}
        style={sectionLabel}
      >
        {title}
      </ConstantText>
      <ConstantText
        size={uiScale.filter.text.note}
        typography={textStyle.filter.note}
        style={[styles.description, { color: filter.noteText }]}
      >
        {description}
      </ConstantText>
      <View style={styles.sliderRow}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={lastIndex}
          step={1}
          value={index}
          onValueChange={(value) => setIndex(clampIndex(value))}
          onSlidingComplete={(value) => onCommit(clampIndex(value))}
          minimumTrackTintColor={filter.slider.filledBar}
          maximumTrackTintColor={filter.slider.unfilledBar}
          thumbTintColor={filter.slider.thumb}
          accessibilityLabel={title}
        />
        <ConstantText
          size={uiScale.filter.buttons.checkbox.text!}
          typography={textStyle.filter.revertButton}
          style={[styles.value, { color: text.secondary }]}
        >
          {formatStep(index)}
        </ConstantText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  description: {
    marginTop: 4,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  value: {
    minWidth: 52,
    textAlign: "right",
  },
});
