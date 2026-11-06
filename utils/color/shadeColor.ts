/** `#rrggbb` or `#rgb` mixed with black: 0 keeps the color, 1 is black. Returns `rgb(r,g,b)`. */
export function shadeColor(hex: string, blackRatio: number): string {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const value = Number.parseInt(expanded, 16);
  const keep = 1 - Math.min(1, Math.max(0, blackRatio));
  const r = Math.round(((value >> 16) & 255) * keep);
  const g = Math.round(((value >> 8) & 255) * keep);
  const b = Math.round((value & 255) * keep);
  return `rgb(${r},${g},${b})`;
}
