"use client";

import { supabase } from "./supabase/client";

// Reading and saving events, to-dos and goals in your private database.
// Tables are created by supabase/phase2.sql.

export const EVENT_TAGS = ["Me time", "Wellness", "Business", "Friends & family", "Errands"] as const;
export const TODO_LISTS = ["Personal", "Money & Grace Co.", "Home", "Errands"] as const;
export const GOAL_AREAS = ["Glow-up", "Money", "Business", "Wellness", "Home", "Relationships"] as const;

export type PlannerEvent = {
  id: string;
  title: string;
  day: string; // YYYY-MM-DD
  start_min: number | null; // null = all day
  minutes: number;
  tag: string;
  notes: string | null;
};
export type NewEvent = Omit<PlannerEvent, "id">;

export type Todo = { id: string; title: string; list: string; due: string | null; done: boolean; created_at: string };
export type Milestone = { title: string; done: boolean };
export type Goal = { id: string; title: string; area: string; target: string | null; why: string | null; milestones: Milestone[] };

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

// ---------- events ----------
export async function listEvents(from: string, to: string) {
  return check<PlannerEvent[]>(
    await supabase()
      .from("events")
      .select("id, title, day, start_min, minutes, tag, notes")
      .gte("day", from)
      .lte("day", to)
      .order("day")
      .order("start_min", { ascending: true, nullsFirst: true }),
  );
}
export async function saveEvent(e: NewEvent, id?: string) {
  const q = id ? supabase().from("events").update(e).eq("id", id) : supabase().from("events").insert(e);
  check(await q);
}
export async function deleteEvent(id: string) {
  check(await supabase().from("events").delete().eq("id", id));
}

// ---------- to-dos ----------
export async function listTodos() {
  return check<Todo[]>(
    await supabase()
      .from("todos")
      .select("id, title, list, due, done, created_at")
      .order("done")
      .order("due", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
  );
}
export async function addTodo(t: { title: string; list: string; due: string | null }) {
  check(await supabase().from("todos").insert(t));
}
export async function setTodoDone(id: string, done: boolean) {
  check(await supabase().from("todos").update({ done, done_at: done ? new Date().toISOString() : null }).eq("id", id));
}
export async function deleteTodo(id: string) {
  check(await supabase().from("todos").delete().eq("id", id));
}

// ---------- goals ----------
export async function listGoals() {
  return check<Goal[]>(
    await supabase().from("goals").select("id, title, area, target, why, milestones").order("created_at"),
  );
}
export async function addGoal(g: Omit<Goal, "id">) {
  check(await supabase().from("goals").insert(g));
}
export async function updateMilestones(id: string, milestones: Milestone[]) {
  check(await supabase().from("goals").update({ milestones }).eq("id", id));
}
export async function deleteGoal(id: string) {
  check(await supabase().from("goals").delete().eq("id", id));
}

// ---------- phase 3: settings (habits & routines) ----------
// Tables are created by supabase/phase3.sql.

export type HabitDef = { id: string; name: string };
export type Routine = { id: string; name: string; steps: string[] };
export type Settings = { habits: HabitDef[] | null; routines: Routine[] | null };

export async function getSettings() {
  return check<Settings | null>(await supabase().from("settings").select("habits, routines").maybeSingle());
}
export async function saveSettings(patch: Partial<Settings>) {
  check(await supabase().from("settings").upsert({ ...patch, updated_at: new Date().toISOString() }));
}

// ---------- phase 3: history for trends ----------
export type DayRow = { day: string; water: number; mood: string | null; sleep_minutes: number | null; steps: number | null };
export async function listDays(from: string, to: string) {
  return check<DayRow[]>(
    await supabase().from("day_entries").select("day, water, mood, sleep_minutes, steps").gte("day", from).lte("day", to).order("day"),
  );
}
export type WeekRow = { week_start: string; checks: Record<string, boolean[]> };
export async function listWeeks(from: string, to: string) {
  return check<WeekRow[]>(
    await supabase().from("habit_weeks").select("week_start, checks").gte("week_start", from).lte("week_start", to).order("week_start"),
  );
}

// ---------- phase 3: cycle ----------
export type Period = { id: string; start_day: string; end_day: string | null };
export async function listPeriods() {
  return check<Period[]>(await supabase().from("periods").select("id, start_day, end_day").order("start_day", { ascending: false }).limit(24));
}
export async function startPeriod(day: string) {
  check(await supabase().from("periods").insert({ start_day: day }));
}
export async function endPeriod(id: string, day: string) {
  check(await supabase().from("periods").update({ end_day: day }).eq("id", id));
}
export async function deletePeriod(id: string) {
  check(await supabase().from("periods").delete().eq("id", id));
}

// ---------- phase 3: journal ----------
export type JournalEntry = { day: string; body: string; gratitude: string[]; photos: string[] };
export async function getJournal(day: string) {
  return check<JournalEntry | null>(
    await supabase().from("journal_entries").select("day, body, gratitude, photos").eq("day", day).maybeSingle(),
  );
}
export async function saveJournal(e: JournalEntry) {
  check(await supabase().from("journal_entries").upsert({ ...e, updated_at: new Date().toISOString() }));
}
export async function listJournal(limit = 30) {
  return check<JournalEntry[]>(
    await supabase().from("journal_entries").select("day, body, gratitude, photos").order("day", { ascending: false }).limit(limit),
  );
}

const BUCKET = "journal-photos";

/** Shrinks a photo to at most 1600px and saves it as JPEG in your private folder. */
export async function uploadPhoto(file: File, day: string) {
  const { data: claims } = await supabase().auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) throw new Error("Not signed in");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", 0.85));
  const path = `${uid}/${day}/${crypto.randomUUID()}.jpg`;
  check(await supabase().storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" }));
  return path;
}
export async function photoUrls(paths: string[]) {
  if (!paths.length) return {} as Record<string, string>;
  const res = await supabase().storage.from(BUCKET).createSignedUrls(paths, 60 * 60);
  if (res.error) throw new Error(res.error.message);
  const out: Record<string, string> = {};
  for (const d of res.data) if (d.path && d.signedUrl) out[d.path] = d.signedUrl;
  return out;
}
export async function removePhoto(path: string) {
  check(await supabase().storage.from(BUCKET).remove([path]));
}
