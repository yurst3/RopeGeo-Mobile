import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PageDataSource } from "ropegeo-common/models";

const SOURCE_DISPLAY: Record<PageDataSource, string> = {
  [PageDataSource.Ropewiki]: "Ropewiki",
};

const SOURCE_ICONS: Record<PageDataSource, number> = {
  [PageDataSource.Ropewiki]: require("@/assets/images/icons/ropewiki.png"),
};

const ALL_SOURCES = Object.values(PageDataSource) as PageDataSource[];

export type DataSourceFilterCheckboxesProps = {
  /** `null` means every source is selected (same semantics as `RouteFilter.sources` / `SearchFilter.source`). */
  value: readonly PageDataSource[] | null;
  onChange: (sources: PageDataSource[] | null) => void;
  title?: string;
};

export function DataSourceFilterCheckboxes({
  value,
  onChange,
  title = "Data sources",
}: DataSourceFilterCheckboxesProps) {
  const singleSourceLock = ALL_SOURCES.length <= 1;

  const selection = (): Set<PageDataSource> => {
    if (value === null) {
      return new Set(ALL_SOURCES);
    }
    return new Set(value);
  };

  const toggle = (d: PageDataSource) => {
    if (singleSourceLock) {
      return;
    }
    const next = new Set(selection());
    if (next.has(d)) {
      next.delete(d);
    } else {
      next.add(d);
    }
    if (next.size === 0 || next.size === ALL_SOURCES.length) {
      onChange(null);
    } else {
      onChange([...next]);
    }
  };

  return (
    <View>
      <Text style={styles.sectionLabel}>{title}</Text>
      {ALL_SOURCES.map((source) => {
        const checked = singleSourceLock || selection().has(source);
        return (
          <Pressable
            key={source}
            style={styles.checkboxRow}
            onPress={() => toggle(source)}
            disabled={singleSourceLock}
            accessibilityRole="checkbox"
            accessibilityState={{ checked, disabled: singleSourceLock }}
          >
            <View
              style={[
                styles.checkboxBox,
                checked && styles.checkboxBoxChecked,
              ]}
            >
              {checked ? <Text style={styles.checkboxMark}>✓</Text> : null}
            </View>
            <View style={styles.checkboxLabelRow}>
              <Text style={styles.checkboxLabel}>{SOURCE_DISPLAY[source]}</Text>
              <Image
                source={SOURCE_ICONS[source]}
                style={styles.sourceIcon}
                contentFit="contain"
              />
            </View>
          </Pressable>
        );
      })}
    </View>
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
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#9ca3af",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxBoxChecked: {
    borderColor: "#3b82f6",
    backgroundColor: "#dbeafe",
  },
  checkboxMark: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1d4ed8",
  },
  checkboxLabelRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 15,
    color: "#111827",
  },
  sourceIcon: {
    width: 30,
    height: 30,
  },
});
