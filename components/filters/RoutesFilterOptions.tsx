import type { ComponentType } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { UnknownBadge } from "@/components/badges/UnknownBadge";
import { CanyonBadge } from "@/components/badges/routeType/CanyonBadge";
import { CaveBadge } from "@/components/badges/routeType/CaveBadge";
import { PoiBadge } from "@/components/badges/routeType/PoiBadge";
import { RouteFilter, RouteType } from "ropegeo-common/models";
import { DataSourceFilterCheckboxes } from "./DataSourceFilterCheckboxes";

const ROUTE_TYPE_ORDER: RouteType[] = [
  RouteType.Canyon,
  RouteType.Cave,
  RouteType.POI,
  RouteType.Unknown,
];

const ROUTE_TYPE_FILTER_BADGES: Record<
  RouteType,
  ComponentType<{ showLabel?: boolean }>
> = {
  [RouteType.Canyon]: CanyonBadge,
  [RouteType.Cave]: CaveBadge,
  [RouteType.POI]: PoiBadge,
  [RouteType.Unknown]: UnknownBadge,
};

const ALL_ROUTE_TYPES = ROUTE_TYPE_ORDER;

function cloneFilter(f: RouteFilter): RouteFilter {
  return RouteFilter.fromJsonString(f.toString());
}

export type RoutesFilterOptionsProps = {
  filter: RouteFilter;
  onChange: (filter: RouteFilter) => void;
};

export function RoutesFilterOptions({
  filter,
  onChange,
}: RoutesFilterOptionsProps) {
  const patch = (fn: (r: RouteFilter) => void) => {
    const r = cloneFilter(filter);
    fn(r);
    onChange(r);
  };

  const routeTypeSelection = (): Set<RouteType> => {
    if (filter.routeTypes === null) {
      return new Set(ALL_ROUTE_TYPES);
    }
    return new Set(filter.routeTypes);
  };

  const toggleRouteType = (t: RouteType) => {
    const next = new Set(routeTypeSelection());
    if (next.has(t)) {
      next.delete(t);
    } else {
      next.add(t);
    }
    patch((r) => {
      if (next.size === 0 || next.size === ALL_ROUTE_TYPES.length) {
        r.routeTypes = null;
      } else {
        r.routeTypes = ALL_ROUTE_TYPES.filter((x) => next.has(x));
      }
    });
  };

  return (
    <>
      <View>
        <Text style={[styles.sectionLabel, styles.sectionLabelFirst]}>
          Route types
        </Text>
        <View style={styles.routeTypeGrid}>
          {ALL_ROUTE_TYPES.map((t) => {
            const checked =
              filter.routeTypes === null || routeTypeSelection().has(t);
            const Badge = ROUTE_TYPE_FILTER_BADGES[t];
            return (
              <View key={t} style={styles.routeTypeCell}>
                <Pressable
                  style={styles.checkboxRow}
                  onPress={() => toggleRouteType(t)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                >
                  <View
                    style={[
                      styles.checkboxBox,
                      checked && styles.checkboxBoxChecked,
                    ]}
                  >
                    {checked ? (
                      <Text style={styles.checkboxMark}>✓</Text>
                    ) : null}
                  </View>
                  <View style={styles.routeTypeLabelRow}>
                    <Text style={styles.checkboxLabel}>{t}</Text>
                    <View style={styles.badgeThumbWrap}>
                      <Badge />
                    </View>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.groupSpacer} />

      <DataSourceFilterCheckboxes
        value={filter.sources}
        onChange={(sources) => patch((r) => { r.sources = sources; })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  groupSpacer: {
    height: 32,
  },
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
  routeTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  routeTypeCell: {
    width: "50%",
    paddingHorizontal: 6,
  },
  routeTypeLabelRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "nowrap",
  },
  badgeThumbWrap: {
    transform: [{ scale: 0.75 }],
    marginLeft: -4,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
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
  checkboxLabel: {
    fontSize: 15,
    color: "#111827",
  },
});
