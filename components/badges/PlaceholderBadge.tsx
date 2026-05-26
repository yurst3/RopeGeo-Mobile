import { Badge } from "./Badge";
import { useColorTheme } from "@/context/ColorThemeContext";

const DEFAULT_SIZE = 32;

/** Grey circle, no icons, no outline — for loading / placeholder rows. */
export function PlaceholderBadge({ size = DEFAULT_SIZE }: { size?: number }) {
  const themeColors = useColorTheme();
  return (
    <Badge
      backgroundColor={themeColors.placeholder}
      outline={false}
      size={size}
    />
  );
}
