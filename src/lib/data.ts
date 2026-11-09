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
