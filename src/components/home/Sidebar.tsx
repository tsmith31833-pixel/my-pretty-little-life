import { Icon } from "../Icon";
import { Bow } from "../Ornaments";
import type { IconName } from "@/lib/icons";

type NavItem = { label: string; icon: IconName; current?: boolean };
const NAV: (string | NavItem)[] = [
  { label: "Today", icon: "sun", current: true },
  { label: "Planner", icon: "planner" },
  { label: "Calendar", icon: "calendar" },
  { label: "Wellness", icon: "heart" },
  { label: "Journal", icon: "journal" },
  "Money",
  { label: "Personal finance", icon: "coin" },
  { label: "Money & Grace Co.", icon: "gem" },
  "Life",
  { label: "Home", icon: "home" },
  { label: "Settings", icon: "gear" },
];

type Props = { open: boolean; onSoon: (label: string) => void };

export function Sidebar({ open, onSoon }: Props) {
  return (
    <aside className={`sidebar${open ? " open" : ""}`} id="sidebar" aria-label="Main navigation">
      <div className="brand">
        <span className="script">
          My Pretty
          <br />
          Little Life
        </span>
        <small>Personal planner</small>
        <Bow className="bow" />
      </div>
      <nav className="nav">
        {NAV.map((n) =>
          typeof n === "string" ? (
            <div className="group" key={n}>{n}</div>
          ) : (
            <button
              type="button"
              key={n.label}
              className={n.current ? "on" : ""}
              aria-current={n.current ? "page" : undefined}
              onClick={n.current ? undefined : () => onSoon(n.label)}
            >
              <Icon name={n.icon} />
              <span>{n.label}</span>
              {!n.current && <span className="soon">Soon</span>}
            </button>
          ),
        )}
      </nav>
      <div className="note">
        <span className="eyebrow">Note to self</span>
        <p>You are allowed to take up space, rest, and shine at your own pace.</p>
      </div>
      <div className="me">
        <span className="av"><Icon name="lock" /></span>
        <div><b>Private planner</b>Only you can see this</div>
      </div>
    </aside>
  );
}
