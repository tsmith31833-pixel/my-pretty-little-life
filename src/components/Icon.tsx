import { ICONS, type IconName } from "@/lib/icons";

type Props = { name: IconName; filled?: boolean; strokeWidth?: number };

export function Icon({ name, filled = false, strokeWidth = 1.6 }: Props) {
  return (
    <svg
      className="ic"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}
