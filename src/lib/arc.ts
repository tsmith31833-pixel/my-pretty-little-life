"use client";

import { supabase } from "./supabase/client";
import { addDays, isoDate } from "./dates";

// 12-week arcs, like your Winter Arc (table: arcs, see supabase/phase10.sql).

export type Check = { id: string; text: string; done: boolean };
export type ArcHabit = { id: string; name: string };
export type ArcWeek = {
  theme: string;
  focus: string;
  goals: Check[];
  checks: Record<string, boolean[]>; // habit id → 7 days
  wins: string;
  lessons: string;
  rating: number; // 0–5
};
export type ArcData = { goals: Check[]; habits: ArcHabit[]; weeks: ArcWeek[] };
export type Arc = { id: string; name: string; start_day: string; data: ArcData };

export const WEEKS = 12;

export const DEFAULT_THEMES = [
  "Reset & plan", "Build the foundation", "Consistency", "Level up", "Deep work", "Midpoint check-in",
  "Push past comfortable", "Discipline over motivation", "Momentum", "Refine", "Finish strong", "Celebrate & reflect",
];

export const DEFAULT_HABITS = ["Move my body", "Read 10 pages", "Create content", "No-spend day", "8 glasses of water", "In bed by 10:30"];

const rid = () => Math.random().toString(36).slice(2, 9);

export function blankArc(start: string, goals: string[], habits: string[], themes: string[]): Omit<Arc, "id"> {
  const habitDefs = habits.filter((h) => h.trim()).map((h) => ({ id: `h_${rid()}`, name: h.trim() }));
  return {
    name: "Winter Arc",
    start_day: start,
    data: {
      goals: goals.filter((g) => g.trim()).map((g) => ({ id: rid(), text: g.trim(), done: false })),
      habits: habitDefs,
      weeks: Array.from({ length: WEEKS }, (_, i) => ({
        theme: themes[i]?.trim() || DEFAULT_THEMES[i],
        focus: "",
        goals: [],
        checks: {},
        wins: "",
        lessons: "",
        rating: 0,
      })),
    },
  };
}

export function weekDates(arc: Pick<Arc, "start_day">, i: number) {
  const start = addDays(new Date(`${arc.start_day}T12:00:00`), i * 7);
  return Array.from({ length: 7 }, (_, d) => addDays(start, d));
}

/** Which week today falls in: -1 before the arc, 12 after it. */
export function currentWeek(arc: Pick<Arc, "start_day">, now: Date) {
  const start = new Date(`${arc.start_day}T12:00:00`).getTime();
  const days = Math.floor((new Date(isoDate(now) + "T12:00:00").getTime() - start) / 864e5);
  if (days < 0) return -1;
  return Math.min(WEEKS, Math.floor(days / 7));
}

/** Share of the week done: daily check-ins (only days so far) plus weekly goals. */
export function weekProgress(arc: Arc, i: number, now: Date) {
  const w = arc.data.weeks[i];
  if (!w) return 0;
  const today = isoDate(now);
  const days = weekDates(arc, i).filter((d) => isoDate(d) <= today).length;
  let total = 0;
  let done = 0;
  for (const h of arc.data.habits) {
    total += days;
    done += (w.checks[h.id] ?? []).slice(0, days).filter(Boolean).length;
  }
  total += w.goals.length;
  done += w.goals.filter((g) => g.done).length;
  return total ? done / total : 0;
}

export async function getArc(): Promise<Arc | null> {
  const res = await supabase().from("arcs").select("id, name, start_day, data").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (res.error) throw new Error(res.error.message);
  return res.data as Arc | null;
}

export async function createArc(a: Omit<Arc, "id">) {
  const res = await supabase().from("arcs").insert(a).select("id, name, start_day, data").single();
  if (res.error) throw new Error(res.error.message);
  return res.data as Arc;
}

export async function saveArc(a: Arc) {
  const res = await supabase().from("arcs").update({ name: a.name, start_day: a.start_day, data: a.data, updated_at: new Date().toISOString() }).eq("id", a.id);
  if (res.error) throw new Error(res.error.message);
}

export async function deleteArc(id: string) {
  const res = await supabase().from("arcs").delete().eq("id", id);
  if (res.error) throw new Error(res.error.message);
}
