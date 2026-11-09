"use client";

import { useEffect, useState } from "react";
import { getSettings, saveSettings, type HabitDef, type Routine } from "./data";
import { HABITS } from "./sample-data";
import { supabase } from "./supabase/client";

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

// ---------- Profile (phase 5): greeting name and personal goals ----------

export type Profile = { name: string; sleepGoalHours: number; stepGoal: number };
export const DEFAULT_PROFILE: Profile = { name: "Mrs. Presberry", sleepGoalHours: 8, stepGoal: 8000 };

export async function getProfile(): Promise<Profile> {
  const res = await supabase().from("settings").select("profile").maybeSingle();
  // Before phase5.sql is run the column doesn't exist; fall back to the defaults.
  if (res.error) return DEFAULT_PROFILE;
  return { ...DEFAULT_PROFILE, ...((res.data?.profile as Partial<Profile> | null) ?? {}) };
}

export async function saveProfile(p: Profile) {
  const db = supabase();
  const existing = await db.from("settings").select("user_id").maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  const res = existing.data
    ? await db.from("settings").update({ profile: p }).eq("user_id", existing.data.user_id)
    : await db.from("settings").insert({ profile: p });
  if (res.error) throw new Error(res.error.message);
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    let live = true;
    getProfile().then((p) => live && setProfile(p)).catch(() => live && setProfile(DEFAULT_PROFILE));
    return () => {
      live = false;
    };
  }, []);
  return profile;
}
