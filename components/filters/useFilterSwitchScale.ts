import { useText } from "@/context/TextContext";
import { useUiScale } from "@/context/UIScaleContext";
import { useResolvedButtonSelectableScale } from "@/utils/resolvers";

export function useFilterSwitchScale(): number {
  const uiScale = useUiScale();
  return useResolvedButtonSelectableScale(uiScale.filter.buttons.switch);
}
