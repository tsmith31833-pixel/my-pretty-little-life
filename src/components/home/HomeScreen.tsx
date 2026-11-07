"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "../Icon";
import { OrnamentDefs } from "../Ornaments";
import { Sidebar } from "./Sidebar";
import { WelcomeBanner } from "./WelcomeBanner";
import { Priorities } from "./Priorities";
import { Agenda, agendaLeft } from "./Agenda";
import { HabitTracker, habitsLeftToday } from "./HabitTracker";
import { UpcomingEvents } from "./UpcomingEvents";
import { FinancialSnapshot } from "./FinancialSnapshot";
import { BusinessSnapshot } from "./BusinessSnapshot";
import { WellnessTracker } from "./WellnessTracker";
import { DailyWins } from "./DailyWins";
import { usePlannerStore } from "@/lib/planner-store";
import { MONTHS } from "@/lib/dates";
import { supabase } from "@/lib/supabase/client";

type Theme = "light" | "dark";
const THEME_KEY = "mpll-theme";

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function HomeScreen({ now }: { now: Date }) {
  const { status, day, week, todayIdx, updateDay, toggleHabit } = usePlannerStore(now, () =>
    toast("That change didn't save. Check your internet connection and try again."),
  );
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [toastMsg, setToastMsg] = useState<{ text: string; id: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNavOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function toast(text: string) {
    setToastMsg({ text, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2600);
  }

  function soon(label: string) {
    setNavOpen(false);
    toast(`${label} is coming in the next phase.`);
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

  if (status !== "ready") {
    return (
      <div className="loading" role="status">
        <span className="s">My Pretty Little Life</span>
        <p>{status === "loading" ? "Getting your day ready…" : "Your planner couldn't load. Check your internet connection, then refresh the page."}</p>
      </div>
    );
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const prioritiesLeft = day.priorities.filter((p) => !p.done).length;
  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <>
      <OrnamentDefs />
      <div className="app">
        <Sidebar open={navOpen} onSoon={soon} onSignOut={signOut} />
        {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} />}

        <main className="main" id="top">
          <header className="topbar">
            <button className="menu-btn" type="button" aria-label="Open menu" aria-controls="sidebar" aria-expanded={navOpen} onClick={() => setNavOpen(true)}>
              <Icon name="menu" />
            </button>
            <span className="mob-logo">My Pretty Little Life</span>
            <h1>Today</h1>
            <span className="crumb">{MONTHS[now.getMonth()]} {now.getDate()}</span>
            <span className="sp" />
            <span className="pill" title="Priorities, habits, water, mood and wins are yours and saved privately. Agenda, events, money and business show examples until those sections are built.">
              <Icon name="sparkle" />
              <span className="lbl">Some cards show examples</span>
            </span>
            <button className="toggle" type="button" aria-label="Switch light or dark theme" onClick={switchTheme}>
              <span className="knob"><Icon name={theme === "dark" ? "sun" : "moon"} /></span>
              <span className="lbl">{theme === "dark" ? "Blush daylight" : "Midnight rose"}</span>
            </button>
          </header>

          <WelcomeBanner
            now={now}
            eventsAhead={agendaLeft(nowMinutes)}
            prioritiesLeft={prioritiesLeft}
            habitsLeft={habitsLeftToday(week, todayIdx)}
            water={day.water}
          />

          <div className="dash">
            <Priorities priorities={day.priorities} onChange={(p) => updateDay((d) => ({ ...d, priorities: p }))} toast={toast} />
            <Agenda nowMinutes={nowMinutes} />
            <HabitTracker week={week} todayIdx={todayIdx} onToggle={toggleHabit} />
            <UpcomingEvents now={now} />
            <FinancialSnapshot now={now} />
            <BusinessSnapshot now={now} />
            <WellnessTracker
              water={day.water}
              mood={day.mood}
              onWater={(n) => updateDay((d) => ({ ...d, water: n }))}
              onMood={(m) => updateDay((d) => ({ ...d, mood: m }))}
              toast={toast}
            />
            <DailyWins wins={day.wins} onChange={(w) => updateDay((d) => ({ ...d, wins: w }))} toast={toast} />
          </div>

          <footer className="foot">
            <span className="s">xoxo</span>
            Made with love for your pretty little life
          </footer>
        </main>
      </div>

      <nav className="tabbar" aria-label="Quick navigation">
        <button type="button" className="on" onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" })}>
          <Icon name="sun" />Today
        </button>
        <button type="button" onClick={() => soon("Planner")}><Icon name="planner" />Planner</button>
        <button
          type="button"
          aria-label="Add a daily win"
          onClick={() => {
            const input = document.getElementById("winInput");
            input?.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "center" });
            setTimeout(() => input?.focus(), 350);
          }}
        >
          <span className="add"><Icon name="plus" /></span>
        </button>
        <button type="button" onClick={() => soon("Wellness")}><Icon name="heart" />Wellness</button>
        <button type="button" onClick={() => setNavOpen(true)}><Icon name="menu" />More</button>
      </nav>

      <div className={`toast${toastMsg ? " show" : ""}`} role="status" aria-live="polite">
        {toastMsg?.text}
      </div>
    </>
  );
}
