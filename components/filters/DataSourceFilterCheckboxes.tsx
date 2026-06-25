import { ConstantText } from "@/components/text/ConstantText";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { PageDataSource } from "ropegeo-common/models";
import { FilterCheckbox } from "./FilterCheckbox";
import { useFilterCheckboxMetrics } from "@/utils/filters/useFilterCheckboxMetrics";
import { useFilterTheme } from "@/utils/filters/useFilterTheme";

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
  const { sectionLabel, text, themeColors } = useFilterTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const checkboxMetrics = useFilterCheckboxMetrics();
  const sourceIconBackground = themeColors.preview.page.sourceIconBackground;
  const sourceIconShadowColor = themeColors.button.shadowColor;

  const selection = (): Set<PageDataSource> => {
    if (value === null) {
      return new Set(ALL_SOURCES);
    }
    return new Set(value);
  };

  const singleSourceLock = ALL_SOURCES.length <= 1;

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
      <ConstantText
        size={uiScale.filter.text.sectionTitle}
        typography={textStyle.filter.sectionTitle}
        style={[styles.sectionLabel, sectionLabel]}
      >
        {title}
      </ConstantText>
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
            <FilterCheckbox checked={checked} />
            <View style={styles.checkboxLabelRow}>
              <ConstantText
                size={uiScale.filter.buttons.checkbox.text!}
                typography={textStyle.filter.optionLabel}
                style={{ color: text.primary }}
              >
                {SOURCE_DISPLAY[source]}
              </ConstantText>
              <View
                style={[
                  styles.sourceIconCircle,
                  {
                    backgroundColor: sourceIconBackground,
                    shadowColor: sourceIconShadowColor,
                    width: checkboxMetrics.sourceIconCircleSize,
                    height: checkboxMetrics.sourceIconCircleSize,
                    borderRadius: checkboxMetrics.sourceIconCircleSize / 2,
                  },
                ]}
              >
                <Image
                  source={SOURCE_ICONS[source]}
                  style={{
                    width: checkboxMetrics.sourceIconInnerSize,
                    height: checkboxMetrics.sourceIconInnerSize,
                  }}
                  contentFit="contain"
                />
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    marginTop: 0,
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  checkboxLabelRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkboxLabel: {},
  sourceIconCircle: {
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
});
