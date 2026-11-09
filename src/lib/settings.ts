"use client";

import { useEffect, useState } from "react";
import { getSettings, saveSettings, type HabitDef, type Routine } from "./data";
import { HABITS } from "./sample-data";

// Your habit list and self-care routines (table: settings, see supabase/phase3.sql).
// Until you change them, the Glow-up 2027 defaults are used.

export const DEFAULT_HABITS: HabitDef[] = HABITS.map((h) => ({ id: h.id, name: h.name }));

export const DEFAULT_ROUTINES: Routine[] = [
  { id: "am", name: "Morning glow", steps: ["Cleanse", "Vitamin C serum", "Moisturize", "SPF 30+"] },
  { id: "pm", name: "Evening wind-down", steps: ["Remove makeup", "Cleanse", "Treatment or retinol", "Moisturize", "Lip mask"] },
];

export const newId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

export function useSettings(onSaveError: () => void) {
  const [loaded, setLoaded] = useState(false);
  const [habits, setHabits] = useState<HabitDef[]>(DEFAULT_HABITS);
  const [routines, setRoutines] = useState<Routine[]>(DEFAULT_ROUTINES);

  useEffect(() => {
    let live = true;
    getSettings()
      .then((s) => {
        if (!live) return;
        if (s?.habits?.length) setHabits(s.habits);
        if (s?.routines) setRoutines(s.routines);
        setLoaded(true);
      })
      // If settings can't load (for example phase3.sql hasn't been run), keep the defaults.
      .catch(() => live && setLoaded(true));
    return () => {
      live = false;
    };
  }, []);

  function updateHabits(next: HabitDef[]) {
    setHabits(next);
    saveSettings({ habits: next, routines }).catch(onSaveError);
  }
  function updateRoutines(next: Routine[]) {
    setRoutines(next);
    saveSettings({ habits, routines: next }).catch(onSaveError);
  }

  return { loaded, habits, routines, updateHabits, updateRoutines };
}
