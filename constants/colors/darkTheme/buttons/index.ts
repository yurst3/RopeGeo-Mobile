import type { ButtonColors } from "../../types";

import { nonstandardButtons } from "./nonstandardButtons";
import { standardButtons } from "./standardButtons";

export const darkThemeButtons: ButtonColors = {
  standard: standardButtons,
  nonstandard: nonstandardButtons,
  shadowColor: "#ffffff",
};
