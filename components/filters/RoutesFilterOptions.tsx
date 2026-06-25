import { ConstantText } from "@/components/text/ConstantText";
import { ScalingText } from "@/components/text/ScalingText";
import type { ComponentType } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { UnknownBadge } from "@/components/badges/UnknownBadge";
import {
  BadgeLayoutProvider,
} from "@/components/badges/Badge";
import { CanyonBadge } from "@/components/badges/routeType/CanyonBadge";
import { CaveBadge } from "@/components/badges/routeType/CaveBadge";
import { PoiBadge } from "@/components/badges/routeType/PoiBadge";
import { RouteFilter, RouteType } from "ropegeo-common/models";
import { DataSourceFilterCheckboxes } from "./DataSourceFilterCheckboxes";
import { FilterCheckbox } from "./FilterCheckbox";
import { useFilterCheckboxMetrics } from "@/utils/filters/useFilterCheckboxMetrics";
import { useFilterTheme } from "@/utils/filters/useFilterTheme";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";

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
  const { sectionLabel, text } = useFilterTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const checkboxMetrics = useFilterCheckboxMetrics();

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
        <ConstantText
          size={uiScale.filter.text.sectionTitle}
          typography={textStyle.filter.sectionTitle}
          style={[styles.sectionLabel, styles.sectionLabelFirst, sectionLabel]}
        >
          Route types
        </ConstantText>
        {ALL_ROUTE_TYPES.map((t) => {
            const checked =
              filter.routeTypes === null || routeTypeSelection().has(t);
            const Badge = ROUTE_TYPE_FILTER_BADGES[t];
            return (
              <Pressable
                key={t}
                style={[
                  styles.checkboxRow,
                  { minHeight: checkboxMetrics.routeTypeBadgeSize },
                ]}
                onPress={() => toggleRouteType(t)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
              >
                <FilterCheckbox checked={checked} />
                <ScalingText
                  size={uiScale.filter.buttons.checkbox.text!}
                  typography={textStyle.filter.optionLabel}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  measure={{ type: "width", widthSafetyMargin: 2 }}
                  containerStyle={styles.routeTypeLabelText}
                  style={{ color: text.primary }}
                >
                  {t}
                </ScalingText>
                <View
                  style={[
                    styles.badgeThumbWrap,
                    {
                      width: checkboxMetrics.routeTypeBadgeSize,
                      height: checkboxMetrics.routeTypeBadgeSize,
                    },
                  ]}
                >
                  <BadgeLayoutProvider
                    size={checkboxMetrics.routeTypeBadgeSize}
                    labelFontSize={checkboxMetrics.routeTypeBadgeLabelFontSize}
                  >
                    <Badge />
                  </BadgeLayoutProvider>
                </View>
              </Pressable>
            );
          })}
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
    marginTop: 0,
    marginBottom: 8,
  },
  sectionLabelFirst: {
    marginTop: 12,
  },
  routeTypeLabelText: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    justifyContent: "center",
    marginRight: 8,
  },
  badgeThumbWrap: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    paddingVertical: 8,
  },
});
