import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { SavedPagesFilter } from "ropegeo-common/models";
import { useFilterTheme } from "./useFilterTheme";

function cloneFilter(f: SavedPagesFilter): SavedPagesFilter {
  return SavedPagesFilter.fromJsonString(f.toString());
}

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
  const { checkbox } = filter;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? checkbox.checkedFill : cardHighlight,
          borderColor: selected ? checkbox.checkedOutline : checkbox.uncheckedOutline,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: text.secondary },
          selected && { color: text.link, fontWeight: "600" },
        ]}
      >
        {label}
      </Text>
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

  const patch = (fn: (s: SavedPagesFilter) => void) => {
    const s = cloneFilter(filter);
    fn(s);
    onChange(s);
  };

  return (
    <>
      <Text style={[styles.sectionLabel, styles.sectionLabelFirst, sectionLabel]}>
        Sort by saved date
      </Text>
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
        <Text style={switchLabel}>Match AKA names</Text>
        <Switch
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 14 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
});
