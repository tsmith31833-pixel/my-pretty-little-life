"use client";

import { useCallback, useState } from "react";
import { HABITS } from "./sample-data";
import { addDays, isoDate } from "./dates";

// For now your entries are saved in this browser only.
// Phase 1 moves this into your private Supabase database so it syncs across devices.

export type Priority = { text: string; done: boolean };
export type DayState = { priorities: Priority[]; water: number; mood: string; wins: string[] };
export type WeekState = Record<string, boolean[]>;
type Saved = { days: Record<string, DayState>; weeks: Record<string, WeekState> };

const KEY = "mpll-planner-v1";

function sampleDay(): DayState {
  return {
    priorities: [
      { text: "Send the Debt-Free by Spring invite", done: true },
      { text: "Order birthday flowers for Mom", done: false },
      { text: "Meal-prep lunches for the week", done: false },
    ],
    water: 5,
    mood: "Happy",
    wins: ["Woke up before my alarm", "Said no to an impulse buy"],
  };
}

function sampleWeek(todayIdx: number): WeekState {
  const w: WeekState = {};
  for (const h of HABITS) {
    w[h.id] = h.sample.split("").map((c, i) => (i < todayIdx ? c === "1" : i === todayIdx && h.id === "skin"));
  }
  return w;
}

function read(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Saved;
  } catch {}
  return { days: {}, weeks: {} };
}

export function usePlannerStore(today: Date) {
  const dayKey = isoDate(today);
  const todayIdx = today.getDay();
  const weekKey = isoDate(addDays(today, -todayIdx));

  const [saved, setSaved] = useState<Saved>(() => {
    const s = read();
    s.days[dayKey] ??= sampleDay();
    s.weeks[weekKey] ??= sampleWeek(todayIdx);
    return s;
  });

  const persist = useCallback((next: Saved) => {
    setSaved(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const day = saved.days[dayKey] ?? sampleDay();
  const week = saved.weeks[weekKey] ?? sampleWeek(todayIdx);

  const updateDay = (fn: (d: DayState) => DayState) =>
    persist({ ...saved, days: { ...saved.days, [dayKey]: fn(day) } });

  const toggleHabit = (id: string, dayIdx: number) => {
    const row = [...(week[id] ?? Array(7).fill(false))];
    row[dayIdx] = !row[dayIdx];
    persist({ ...saved, weeks: { ...saved.weeks, [weekKey]: { ...week, [id]: row } } });
    return row[dayIdx];
  };

  return { day, week, todayIdx, updateDay, toggleHabit };
}
