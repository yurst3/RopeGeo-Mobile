import type { ButtonColors } from "../../types";

import { nonstandardButtons } from "./nonstandardButtons";
import { standardButtons } from "./standardButtons";

export const lightThemeButtons: ButtonColors = {
  standard: standardButtons,
  nonstandard: nonstandardButtons,
  shadowColor: "#000000",
};
