import { AddBlockButton } from "@/components/buttons/nonstandard/AddBlockButton";

const ADD_TEXT_ICON = require("@/assets/images/icons/buttons/addText.png");

export function AddTextBlockButton({ onPress }: { onPress: () => void }) {
  return <AddBlockButton label="Add Text" icon={ADD_TEXT_ICON} onPress={onPress} />;
}
