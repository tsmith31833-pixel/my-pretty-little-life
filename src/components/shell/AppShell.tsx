"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "../Icon";
import { OrnamentDefs } from "../Ornaments";
import { Sidebar } from "./Sidebar";
import { QuickAdd } from "./QuickAdd";
import { supabase } from "@/lib/supabase/client";

// The frame around every page: sidebar, top bar, phone tab bar, quick add and toasts.

type Shell = {
  toast: (message: string) => void;
  /** Increases whenever something is added through quick add, so pages can reload. */
  version: number;
  bump: () => void;
};
const ShellContext = createContext<Shell>({ toast: () => {}, version: 0, bump: () => {} });
export const useShell = () => useContext(ShellContext);

type Theme = "light" | "dark";
const THEME_KEY = "mpll-theme";
function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

type Props = { title: string; crumb?: string; examplesNote?: string; children: React.ReactNode };

export function AppShell({ title, crumb, examplesNote, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [version, setVersion] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNavOpen(false);
        setQuickOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function toast(text: string) {
    setToastMsg(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2800);
  }

  function soon(label: string) {
    setNavOpen(false);
    toast(`${label} is coming in a later phase.`);
  }

  function switchTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
  }

  async function signOut() {
    await supabase().auth.signOut();
    router.replace("/login");
  }

  const shell: Shell = { toast, version, bump: () => setVersion((v) => v + 1) };
  const tab = (href: string) => (pathname === href ? "on" : "");

  return (
    <ShellContext.Provider value={shell}>
      <OrnamentDefs />
      <div className="app">
        <Sidebar open={navOpen} pathname={pathname} onNavigate={() => setNavOpen(false)} onSoon={soon} onSignOut={signOut} />
        {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} />}

        <main className="main" id="top">
          <header className="topbar">
            <button className="menu-btn" type="button" aria-label="Open menu" aria-controls="sidebar" aria-expanded={navOpen} onClick={() => setNavOpen(true)}>
              <Icon name="menu" />
            </button>
            <span className="mob-logo">My Pretty Little Life</span>
            <h1>{title}</h1>
            {crumb && <span className="crumb">{crumb}</span>}
            <span className="sp" />
            {examplesNote && (
              <span className="pill" title={examplesNote}>
                <Icon name="sparkle" />
                <span className="lbl">Some cards show examples</span>
              </span>
            )}
            <button className="btn add-btn" type="button" onClick={() => setQuickOpen(true)}>
              <Icon name="plus" strokeWidth={2.2} />
              <span className="lbl">Quick add</span>
            </button>
            <button className="toggle" type="button" aria-label="Switch light or dark theme" onClick={switchTheme}>
              <span className="knob"><Icon name={theme === "dark" ? "sun" : "moon"} /></span>
              <span className="lbl">{theme === "dark" ? "Blush daylight" : "Midnight rose"}</span>
            </button>
          </header>

          {children}

          <footer className="foot">
            <span className="s">xoxo</span>
            Made with love for your pretty little life
          </footer>
        </main>
      </div>

      <nav className="tabbar" aria-label="Quick navigation">
        <Link href="/" className={tab("/")}><Icon name="sun" />Today</Link>
        <Link href="/planner" className={tab("/planner")}><Icon name="planner" />Planner</Link>
        <button type="button" aria-label="Quick add" onClick={() => setQuickOpen(true)}>
          <span className="add"><Icon name="plus" /></span>
        </button>
        <Link href="/calendar" className={tab("/calendar")}><Icon name="calendar" />Calendar</Link>
        <button type="button" onClick={() => setNavOpen(true)}><Icon name="menu" />More</button>
      </nav>

      {quickOpen && <QuickAdd onClose={() => setQuickOpen(false)} />}

      <div className={`toast${toastMsg ? " show" : ""}`} role="status" aria-live="polite">
        {toastMsg}
      </div>
    </ShellContext.Provider>
  );
}
