import { ConstantText } from "@/components/text/ConstantText";
import { useTextStyle } from "@/context/TextContext";
import { useUiScale } from "@/context/UIScaleContext";
import { Pressable, StyleSheet, View } from "react-native";
import { SavedPagesFilter, type SavedPagesOrder } from "ropegeo-common/models";
import { ScaledFilterSwitch } from "./ScaledFilterSwitch";
import { useFilterRadioMetrics } from "./useFilterRadioMetrics";
import { useFilterTheme } from "./useFilterTheme";

function cloneFilter(f: SavedPagesFilter): SavedPagesFilter {
  return SavedPagesFilter.fromJsonString(f.toString());
}

const SAVED_PAGES_ORDERS: SavedPagesOrder[] = ["newest", "oldest"];

const ORDER_LABELS: Record<SavedPagesOrder, string> = {
  newest: "Newest",
  oldest: "Oldest",
};

type SavedPagesOrderRadioGroupProps = {
  selectedOrder: SavedPagesOrder;
  onSelectOrder: (order: SavedPagesOrder) => void;
};

function SavedPagesOrderRadioGroup({
  selectedOrder,
  onSelectOrder,
}: SavedPagesOrderRadioGroupProps) {
  const { filter, text } = useFilterTheme();
  const { radioButton } = filter;
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const radioButtonSpec = uiScale.filter.buttons.radio;
  const radioMetrics = useFilterRadioMetrics();

  return (
    <View style={styles.radioGroup}>
      {SAVED_PAGES_ORDERS.map((order) => {
        const selected = selectedOrder === order;
        return (
          <Pressable
            key={order}
            style={styles.radioOption}
            onPress={() => onSelectOrder(order)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <View
              style={[
                styles.radioOuter,
                {
                  width: radioMetrics.outerSize,
                  height: radioMetrics.outerSize,
                  borderRadius: radioMetrics.outerRadius,
                  borderWidth: radioMetrics.borderWidth,
                  marginRight: radioMetrics.marginRight,
                  borderColor: radioButton.uncheckedOutline,
                },
                selected && { borderColor: radioButton.checkedFill },
              ]}
            >
              {selected ? (
                <View
                  style={[
                    styles.radioInner,
                    {
                      width: radioMetrics.innerSize,
                      height: radioMetrics.innerSize,
                      borderRadius: radioMetrics.innerRadius,
                      backgroundColor: radioButton.checkedFill,
                    },
                  ]}
                />
              ) : null}
            </View>
            <ConstantText
              size={radioButtonSpec.text!}
              typography={textStyle.filter.optionLabel}
              style={{ color: text.primary }}
            >
              {ORDER_LABELS[order]}
            </ConstantText>
          </Pressable>
        );
      })}
    </View>
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
  const uiScale = useUiScale();
  const textStyle = useTextStyle();

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
      <SavedPagesOrderRadioGroup
        selectedOrder={filter.order}
        onSelectOrder={(order) => patch((s) => s.setOrder(order))}
      />
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
  radioGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  radioOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    paddingVertical: 6,
  },
  radioOuter: {
    flexShrink: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {},
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
});
