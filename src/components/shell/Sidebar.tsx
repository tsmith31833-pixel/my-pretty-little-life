import Link from "next/link";
import { Icon } from "../Icon";
import { Bow } from "../Ornaments";
import type { IconName } from "@/lib/icons";

type NavItem = { label: string; icon: IconName; href?: string };
const NAV: (string | NavItem)[] = [
  { label: "Today", icon: "sun", href: "/" },
  { label: "Planner", icon: "planner", href: "/planner" },
  { label: "Calendar", icon: "calendar", href: "/calendar" },
  { label: "Wellness", icon: "heart" },
  { label: "Journal", icon: "journal" },
  "Money",
  { label: "Personal finance", icon: "coin" },
  { label: "Money & Grace Co.", icon: "gem" },
  "Life",
  { label: "Home", icon: "home" },
  { label: "Settings", icon: "gear" },
];

type Props = {
  open: boolean;
  pathname: string;
  onNavigate: () => void;
  onSoon: (label: string) => void;
  onSignOut: () => void;
};

export function Sidebar({ open, pathname, onNavigate, onSoon, onSignOut }: Props) {
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
        {NAV.map((n) => {
          if (typeof n === "string") return <div className="group" key={n}>{n}</div>;
          if (n.href) {
            const current = pathname === n.href;
            return (
              <Link key={n.label} href={n.href} className={current ? "on" : ""} aria-current={current ? "page" : undefined} onClick={onNavigate}>
                <Icon name={n.icon} />
                <span>{n.label}</span>
              </Link>
            );
          }
          return (
            <button type="button" key={n.label} onClick={() => onSoon(n.label)}>
              <Icon name={n.icon} />
              <span>{n.label}</span>
              <span className="soon">Soon</span>
            </button>
          );
        })}
      </nav>
      <div className="note">
        <span className="eyebrow">Note to self</span>
        <p>You are allowed to take up space, rest, and shine at your own pace.</p>
      </div>
      <div className="me">
        <span className="av"><Icon name="lock" /></span>
        <div><b>Private planner</b>Only you can see this</div>
      </div>
      <button type="button" className="signout" onClick={onSignOut}>Sign out</button>
    </aside>
  );
}
