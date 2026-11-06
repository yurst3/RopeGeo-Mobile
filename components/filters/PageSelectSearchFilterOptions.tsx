import { ConstantText } from "@/components/text/ConstantText";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { View } from "react-native";
import {
  SearchFilter,
  type SearchOrder,
  type SearchParamsPosition,
} from "ropegeo-common/models";
import { DataSourceFilterCheckboxes } from "./DataSourceFilterCheckboxes";
import { ScaledFilterSwitch } from "./ScaledFilterSwitch";
import {
  cloneSearchFilter,
  NameSimilaritySection,
  searchFilterOptionStyles,
  SearchOrderSection,
} from "./SearchFilterOptions";
import { useFilterTheme } from "@/utils/filters/useFilterTheme";

export type PageSelectSearchFilterOptionsProps = {
  filter: SearchFilter;
  onChange: (filter: SearchFilter) => void;
  /** Required to enable distance ranking; shows an alert if distance is chosen without a fix. */
  livePosition: SearchParamsPosition | null;
};

/** {@link SearchFilterOptions} for picking pages: results are always pages, never regions. */
export function PageSelectSearchFilterOptions({
  filter,
  onChange,
  livePosition,
}: PageSelectSearchFilterOptionsProps) {
  const { switchLabel, switchProps } = useFilterTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();

  const patch = (fn: (s: SearchFilter) => void) => {
    const s = cloneSearchFilter(filter);
    fn(s);
    s.setIncludePages(true);
    s.setIncludeRegions(false);
    onChange(s);
  };

  return (
    <>
      <SearchOrderSection
        selectedOrder={filter.order}
        livePosition={livePosition}
        onChangeOrder={(o: SearchOrder) => patch((s) => s.setOrder(o))}
      />

      <View style={searchFilterOptionStyles.groupSpacer} />

      <View style={searchFilterOptionStyles.switchRow}>
        <ConstantText
          size={uiScale.filter.buttons.switch.text!}
          typography={textStyle.filter.optionLabel}
          style={switchLabel}
        >
          Match Page Aka Names
        </ConstantText>
        <ScaledFilterSwitch
          value={filter.includeAka}
          onValueChange={(v) => patch((s) => s.setIncludeAka(v))}
          {...switchProps}
        />
      </View>

      <View style={searchFilterOptionStyles.groupSpacer} />

      <NameSimilaritySection
        value={filter.similarityThreshold}
        onChange={(v) => patch((s) => s.setSimilarityThreshold(v))}
      />

      <View style={searchFilterOptionStyles.groupSpacer} />

      <DataSourceFilterCheckboxes
        title="Data Source"
        value={filter.source}
        onChange={(sources) => patch((s) => s.setSource(sources))}
      />
    </>
  );
}
