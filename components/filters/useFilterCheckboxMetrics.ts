import { DEFAULT_BADGE_SIZE } from "@/components/badges/Badge";
import { useText } from "@/context/TextContext";
import { useUiScale } from "@/context/UIScaleContext";
import {
  useResolvedButtonIconScale,
  useResolvedButtonSelectableScale,
} from "@/utils/resolvers";
import { useMemo } from "react";

/** Checkbox box size at default selectable scale. */
const CHECKBOX_BOX_SIZE_AT_REFERENCE = 22;
const CHECKBOX_BORDER_RADIUS_AT_REFERENCE = 4;
const CHECKBOX_BORDER_WIDTH_AT_REFERENCE = 2;
const CHECKBOX_MARGIN_RIGHT_AT_REFERENCE = 10;
/** Checkmark size relative to box height. */
const CHECKBOX_MARK_SIZE_RATIO = 12 / 22;

/** Route-type badge at end of checkbox rows ({@link RoutesFilterOptions}). */
const ROUTE_TYPE_BADGE_SIZE_AT_REFERENCE = Math.round(DEFAULT_BADGE_SIZE * 0.75);
const ROUTE_TYPE_BADGE_LABEL_FONT_SIZE_AT_REFERENCE = Math.round(12 * 0.75);

/** Source icon circle on data-source checkbox rows ({@link DataSourceFilterCheckboxes}). */
const SOURCE_ICON_CIRCLE_SIZE_AT_REFERENCE = 32;
const SOURCE_ICON_INNER_SIZE_AT_REFERENCE = 22;

export function useFilterCheckboxMetrics() {
  const uiScale = useUiScale();
  const checkboxSpec = uiScale.filter.buttons.checkbox;
  const selectableScale = useResolvedButtonSelectableScale(checkboxSpec);
  const iconScale = useResolvedButtonIconScale(checkboxSpec);

  return useMemo(() => {
    const boxSize = Math.round(CHECKBOX_BOX_SIZE_AT_REFERENCE * selectableScale);
    return {
      boxSize,
      borderRadius: Math.max(2, Math.round(CHECKBOX_BORDER_RADIUS_AT_REFERENCE * selectableScale)),
      borderWidth: Math.max(2, Math.round(CHECKBOX_BORDER_WIDTH_AT_REFERENCE * selectableScale)),
      marginRight: Math.round(CHECKBOX_MARGIN_RIGHT_AT_REFERENCE * selectableScale),
      markFontSize: Math.round(boxSize * CHECKBOX_MARK_SIZE_RATIO),
      iconScale,
      routeTypeBadgeSize: Math.round(ROUTE_TYPE_BADGE_SIZE_AT_REFERENCE * iconScale),
      routeTypeBadgeLabelFontSize: Math.round(
        ROUTE_TYPE_BADGE_LABEL_FONT_SIZE_AT_REFERENCE * iconScale,
      ),
      sourceIconCircleSize: Math.round(SOURCE_ICON_CIRCLE_SIZE_AT_REFERENCE * iconScale),
      sourceIconInnerSize: Math.round(SOURCE_ICON_INNER_SIZE_AT_REFERENCE * iconScale),
    };
  }, [selectableScale, iconScale]);
}
