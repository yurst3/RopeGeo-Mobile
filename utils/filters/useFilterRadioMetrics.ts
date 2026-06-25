import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedButtonSelectableScale } from "@/utils/theme/resolvers";
import { useMemo } from "react";

const RADIO_OUTER_SIZE_AT_REFERENCE = 22;
const RADIO_INNER_SIZE_AT_REFERENCE = 12;
const RADIO_MARGIN_RIGHT_AT_REFERENCE = 8;

export function useFilterRadioMetrics() {
  const uiScale = useUiScale();
  const scale = useResolvedButtonSelectableScale(uiScale.filter.buttons.radio);

  return useMemo(() => {
    const outerSize = Math.round(RADIO_OUTER_SIZE_AT_REFERENCE * scale);
    const innerSize = Math.round(RADIO_INNER_SIZE_AT_REFERENCE * scale);
    return {
      outerSize,
      innerSize,
      innerRadius: innerSize / 2,
      outerRadius: outerSize / 2,
      borderWidth: Math.max(2, Math.round(2 * scale)),
      marginRight: Math.round(RADIO_MARGIN_RIGHT_AT_REFERENCE * scale),
    };
  }, [scale]);
}
