"use client";

import { useEffect, useRef, useState } from "react";
import { HABITS } from "./sample-data";
import { addDays, isoDate } from "./dates";
import { supabase } from "./supabase/client";

// Loads and saves your daily entries in your private Supabase database
// (tables: day_entries and habit_weeks — see supabase/schema.sql).

export type Priority = { text: string; done: boolean };
export type DayState = { priorities: Priority[]; water: number; mood: string; wins: string[] };
export type WeekState = Record<string, boolean[]>;

const emptyDay = (): DayState => ({
  priorities: [0, 1, 2].map(() => ({ text: "", done: false })),
  water: 0,
  mood: "",
  wins: [],
});

const emptyWeek = (): WeekState => Object.fromEntries(HABITS.map((h) => [h.id, Array(7).fill(false)]));

type Status = "loading" | "ready" | "error";

export function usePlannerStore(today: Date, onSaveError: () => void) {
  const dayKey = isoDate(today);
  const todayIdx = today.getDay();
  const weekKey = isoDate(addDays(today, -todayIdx));

  const [status, setStatus] = useState<Status>("loading");
  const [day, setDay] = useState<DayState>(emptyDay);
  const [week, setWeek] = useState<WeekState>(emptyWeek);
  const onError = useRef(onSaveError);
  useEffect(() => {
    onError.current = onSaveError;
  });

  useEffect(() => {
    let cancelled = false;
    const db = supabase();
    Promise.all([
      db.from("day_entries").select("priorities, water, mood, wins").eq("day", dayKey).maybeSingle(),
      db.from("habit_weeks").select("checks").eq("week_start", weekKey).maybeSingle(),
    ]).then(([d, w]) => {
      if (cancelled) return;
      if (d.error || w.error) {
        setStatus("error");
        return;
      }
      const base = emptyDay();
      if (d.data) {
        const saved = (d.data.priorities as Priority[]) ?? [];
        setDay({
          priorities: base.priorities.map((p, i) => saved[i] ?? p),
          water: d.data.water ?? 0,
          mood: d.data.mood ?? "",
          wins: (d.data.wins as string[]) ?? [],
        });
      } else {
        setDay(base);
      }
      setWeek({ ...emptyWeek(), ...((w.data?.checks as WeekState) ?? {}) });
      setStatus("ready");
    });
    return () => {
      cancelled = true;
    };
  }, [dayKey, weekKey]);

  function updateDay(fn: (d: DayState) => DayState) {
    const next = fn(day);
    setDay(next);
    supabase()
      .from("day_entries")
      .upsert({ day: dayKey, ...next, mood: next.mood || null, updated_at: new Date().toISOString() })
      .then(({ error }) => error && onError.current());
  }

  function toggleHabit(id: string, dayIdx: number) {
    const row = [...(week[id] ?? Array(7).fill(false))];
    row[dayIdx] = !row[dayIdx];
    const next = { ...week, [id]: row };
    setWeek(next);
    supabase()
      .from("habit_weeks")
      .upsert({ week_start: weekKey, checks: next, updated_at: new Date().toISOString() })
      .then(({ error }) => error && onError.current());
    return row[dayIdx];
  }

  return { status, day, week, todayIdx, updateDay, toggleHabit };
}
