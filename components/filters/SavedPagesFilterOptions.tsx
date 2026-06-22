import { ConstantText } from "@/components/text/ConstantText";
import { useText } from "@/context/TextContext";
import { useResolvedButtonBackgroundScale } from "@/utils/resolvers";
import { Pressable, StyleSheet, View } from "react-native";
import { SavedPagesFilter } from "ropegeo-common/models";
import { ScaledFilterSwitch } from "./ScaledFilterSwitch";
import { useFilterTheme } from "./useFilterTheme";

function cloneFilter(f: SavedPagesFilter): SavedPagesFilter {
  return SavedPagesFilter.fromJsonString(f.toString());
}

const CHIP_PADDING_VERTICAL = 8;
const CHIP_PADDING_HORIZONTAL = 12;
const CHIP_BORDER_RADIUS = 20;

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { filter, text, cardHighlight } = useFilterTheme();
  const { uiScale, style: textStyle } = useText();
  const { checkbox } = filter;
  const chipSpec = uiScale.filter.buttons.chip;
  const backgroundScale = useResolvedButtonBackgroundScale(chipSpec);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? checkbox.checkedFill : cardHighlight,
          borderColor: selected ? checkbox.checkedOutline : checkbox.uncheckedOutline,
          paddingVertical: CHIP_PADDING_VERTICAL * backgroundScale,
          paddingHorizontal: CHIP_PADDING_HORIZONTAL * backgroundScale,
          borderRadius: CHIP_BORDER_RADIUS * backgroundScale,
        },
      ]}
    >
      <ConstantText
        size={chipSpec.text!}
        typography={
          selected
            ? textStyle.filter.sectionTitle
            : textStyle.filter.optionLabel
        }
        style={[
          styles.chipText,
          { color: selected ? text.link : text.secondary },
        ]}
      >
        {label}
      </ConstantText>
    </Pressable>
  );
}

export type SavedPagesFilterOptionsProps = {
  filter: SavedPagesFilter;
  onChange: (filter: SavedPagesFilter) => void;
};

export function SavedPagesFilterOptions({
  filter,
  onChange,
}: SavedPagesFilterOptionsProps) {
  const { sectionLabel, switchLabel, switchTrackColors, switchThumbColor } =
    useFilterTheme();
  const { uiScale, style: textStyle } = useText();

  const patch = (fn: (s: SavedPagesFilter) => void) => {
    const s = cloneFilter(filter);
    fn(s);
    onChange(s);
  };

  return (
    <>
      <ConstantText
        size={uiScale.filter.text.sectionTitle}
        typography={textStyle.filter.sectionTitle}
        style={[styles.sectionLabel, styles.sectionLabelFirst, sectionLabel]}
      >
        Sort by saved date
      </ConstantText>
      <View style={styles.rowWrap}>
        <Chip
          label="Newest"
          selected={filter.order === "newest"}
          onPress={() => patch((s) => s.setOrder("newest"))}
        />
        <Chip
          label="Oldest"
          selected={filter.order === "oldest"}
          onPress={() => patch((s) => s.setOrder("oldest"))}
        />
      </View>
      <View style={styles.switchRow}>
        <ConstantText
          size={uiScale.filter.buttons.switch.text!}
          typography={textStyle.filter.optionLabel}
          style={switchLabel}
        >
          Match AKA names
        </ConstantText>
        <ScaledFilterSwitch
          value={filter.includeAka}
          onValueChange={(v) => patch((s) => s.setIncludeAka(v))}
          trackColor={switchTrackColors}
          thumbColor={switchThumbColor}
          ios_backgroundColor={switchTrackColors.false}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    marginTop: 0,
    marginBottom: 8,
  },
  sectionLabelFirst: {
    marginTop: 12,
  },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
  },
  chipText: {},
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
});
