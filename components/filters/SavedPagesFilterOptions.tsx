import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { SavedPagesFilter } from "ropegeo-common/models";

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
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
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
  const patch = (fn: (s: SavedPagesFilter) => void) => {
    const s = cloneFilter(filter);
    fn(s);
    onChange(s);
  };

  return (
    <>
      <Text style={[styles.sectionLabel, styles.sectionLabelFirst]}>
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
        <Text style={styles.switchLabel}>Match AKA names</Text>
        <Switch
          value={filter.includeAka}
          onValueChange={(v) => patch((s) => s.setIncludeAka(v))}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
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
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  chipSelected: {
    backgroundColor: "#dbeafe",
    borderColor: "#3b82f6",
  },
  chipText: { fontSize: 14, color: "#374151" },
  chipTextSelected: { color: "#1d4ed8", fontWeight: "600" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  switchLabel: { fontSize: 15, color: "#111827", flex: 1, marginRight: 12 },
  footerHint: { fontSize: 13, color: "#6b7280", marginBottom: 8 },
});
