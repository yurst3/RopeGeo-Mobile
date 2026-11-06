import { AddBlockButton } from "@/components/buttons/nonstandard/AddBlockButton";

const ADD_MEDIA_ICON = require("@/assets/images/icons/buttons/addMedia.png");
/** Temporary marker: media blocks aren't implemented yet. */
const WARNING_ICON = require("@/assets/images/temp/warning.png");

export function AddMediaBlockButton({ onPress }: { onPress: () => void }) {
  return (
    <AddBlockButton
      label="Add Media"
      icon={ADD_MEDIA_ICON}
      onPress={onPress}
      cornerIcon={WARNING_ICON}
    />
  );
}
