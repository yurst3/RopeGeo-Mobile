import { useText } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedButtonSelectableScale } from "@/utils/theme/resolvers";

export function useFilterSwitchScale(): number {
  const uiScale = useUiScale();
  return useResolvedButtonSelectableScale(uiScale.filter.buttons.switch);
}
