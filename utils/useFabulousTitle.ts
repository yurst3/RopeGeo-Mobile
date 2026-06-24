import { getFabulousEmoji } from "@/constants/fabulous";
import { useThemePreference } from "@/context/ColorThemeContext";
import { useFontProfileKey } from "@/context/TextContext";
import { useMemo } from "react";

export function useFabulousTitle(title: string): string {
  const themePreference = useThemePreference();
  const fontProfileKey = useFontProfileKey();
  const fabulousDancingScript =
    themePreference === "Fabulous" && fontProfileKey === "DancingScript";

  return useMemo(() => {
    if (!fabulousDancingScript) {
      return title;
    }
    const emoji = getFabulousEmoji();
    return emoji != null ? `${title} ${emoji}` : title;
  }, [fabulousDancingScript, title]);
}
