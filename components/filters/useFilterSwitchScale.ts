import { useText } from "@/context/TextContext";
import { useResolvedButtonSelectableScale } from "@/utils/resolvers";

export function useFilterSwitchScale(): number {
  const { uiScale } = useText();
  return useResolvedButtonSelectableScale(uiScale.filter.buttons.switch);
}
