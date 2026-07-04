import { ScalingTextGroup } from "@/components/text/ScalingTextGroup";
import type { UnitsPreference } from "@/constants/settings";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { FEET, LengthMeasurement } from "ropegeo-common/models";
import type { LengthMeasurementUnit } from "ropegeo-common/models";

/** Horizontal gap between pills within the row. */
const PILL_GAP = 8;
/**
 * Horizontal padding + border of a single pill. The group sizes its font from measured
 * text width only, so this is reserved per pill via `widthSafetyMargin` to avoid overflow.
 */
const PILL_HORIZONTAL_SPACE = 22;

const METERS_UNIT: LengthMeasurementUnit = {
  measurementSystem: "Metric",
  name: "meters",
};

type PreviewItem = { id: string; text: string; highlighted: boolean };

function imperialItems(): PreviewItem[] {
  const oneFoot = new LengthMeasurement(1, FEET);
  return [
    { id: "feet", text: oneFoot.toString(), highlighted: true },
    {
      id: "meters",
      text: oneFoot.toMeasurementSystem("Metric").toString(),
      highlighted: false,
    },
  ];
}

function metricItems(): PreviewItem[] {
  const oneMeter = new LengthMeasurement(1, METERS_UNIT);
  return [
    {
      id: "feet",
      text: oneMeter.toMeasurementSystem("Imperial").toString(),
      highlighted: false,
    },
    { id: "meters", text: oneMeter.toString(), highlighted: true },
  ];
}

function freedomItems(): PreviewItem[] {
  // Freedom units can't be converted *from*, so probe 1ft -> Freedom to discover the
  // randomly chosen unit and how many feet it spans (1 unit = 1 / probe.value feet).
  const probe = new LengthMeasurement(1, FEET).toMeasurementSystem("Freedom");
  const unitFeet = probe.value > 0 ? 1 / probe.value : 0;
  const oneFreedom = new LengthMeasurement(1, probe.unit);
  const inFeet = new LengthMeasurement(unitFeet, FEET);
  return [
    { id: "feet", text: inFeet.toString(), highlighted: false },
    {
      id: "meters",
      text: inFeet.toMeasurementSystem("Metric").toString(),
      highlighted: false,
    },
    { id: "freedom", text: oneFreedom.toString(), highlighted: true },
  ];
}

function buildItems(units: UnitsPreference): PreviewItem[] {
  if (units === "Metric") return metricItems();
  if (units === "Freedom") return freedomItems();
  return imperialItems();
}

export type UnitsConversionPreviewProps = {
  value: UnitsPreference;
};

export function UnitsConversionPreview({ value }: UnitsConversionPreviewProps) {
  const { text, filter } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();

  // Freedom picks a random unit; memoize per selection so it does not re-roll on re-render.
  const items = useMemo(() => buildItems(value), [value]);

  return (
    <ScalingTextGroup
      size={uiScale.settingsScreen.text.unitConversion}
      typography={textStyle.filter.optionLabel}
      gap={PILL_GAP}
      widthSafetyMargin={items.length * PILL_HORIZONTAL_SPACE}
      containerStyle={styles.group}
    >
      {items.map((item) => (
        <ScalingTextGroup.Segment
          key={item.id}
          numberOfLines={1}
          style={[
            styles.pill,
            styles.chipText,
            item.highlighted
              ? { color: text.link, borderColor: filter.checkbox.checkedOutline }
              : { color: text.secondary, borderColor: "transparent" },
          ]}
        >
          {item.text}
        </ScalingTextGroup.Segment>
      ))}
    </ScalingTextGroup>
  );
}

const styles = StyleSheet.create({
  group: {
    marginTop: 24,
    alignItems: "center",
  },
  pill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    textAlign: "center",
  },
});
