import { AddBlockButton } from "@/components/buttons/nonstandard/AddBlockButton";

const ADD_MAP_ICON = require("@/assets/images/icons/buttons/addMap.png");

export function AddMapBlockButton({
  onPress,
  maxMaps,
  limitReached,
}: {
  onPress: () => void;
  maxMaps: number;
  /** Disables the button and explains why. */
  limitReached: boolean;
}) {
  return (
    <AddBlockButton
      label="Add Map"
      icon={ADD_MAP_ICON}
      onPress={onPress}
      disabledLabel={limitReached ? `Limit of ${maxMaps} maps reached` : undefined}
    />
  );
}
