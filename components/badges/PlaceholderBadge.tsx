import { Badge, BadgeBackgroundColor } from "./Badge";

const DEFAULT_SIZE = 32;

/** Grey circle, no icons, no outline — for loading / placeholder rows. */
export function PlaceholderBadge({ size = DEFAULT_SIZE }: { size?: number }) {
  return (
    <Badge
      backgroundColor={BadgeBackgroundColor.Grey}
      outline={false}
      size={size}
    />
  );
}
