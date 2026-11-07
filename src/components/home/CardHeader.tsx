import { Icon } from "../Icon";
import type { IconName } from "@/lib/icons";

type Props = { id: string; icon: IconName; eyebrow: string; title: string; meta?: React.ReactNode };

export function CardHeader({ id, icon, eyebrow, title, meta }: Props) {
  return (
    <header className="card-h">
      <span className="badge"><Icon name={icon} /></span>
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2 id={id}>{title}</h2>
      </div>
      {meta !== undefined && <span className="meta">{meta}</span>}
    </header>
  );
}
