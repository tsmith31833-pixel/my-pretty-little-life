"use client";

import { supabase } from "./supabase/client";

// Gathers everything for the "Pretty Little Year" review page.
// Each part loads on its own, so one missing table doesn't hide the rest.

export type YearData = {
  days: { day: string; water: number; mood: string | null; sleep_minutes: number | null; steps: number | null; wins: string[]; priorities: { text: string; done: boolean }[] }[];
  weeks: { week_start: string; checks: Record<string, boolean[]> }[];
  journal: { day: string; body: string; gratitude: string[]; photos: string[] }[];
  todosDone: number;
  events: number;
  goals: { title: string; milestones: { done: boolean }[] }[];
  spent: number;
  received: number;
  debtsPaid: number;
  savingsSaved: number;
  bizIncome: { day: string; amount: number }[];
  clientDebtPaid: number;
  clientsHelped: number;
  posted: number;
  launches: number;
};

async function rows<T>(q: PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  try {
    const res = await q;
    return res.error ? [] : (res.data ?? []);
  } catch {
    return [];
  }
}

export async function loadYear(year: number): Promise<YearData> {
  const db = supabase();
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const weekFrom = `${year - 1}-12-25`;

  const [days, weeks, journal, todos, events, goals, txns, debts, savings, biz, clients, content, launches] = await Promise.all([
    rows<YearData["days"][number]>(db.from("day_entries").select("day, water, mood, sleep_minutes, steps, wins, priorities").gte("day", from).lte("day", to).order("day").limit(400)),
    rows<YearData["weeks"][number]>(db.from("habit_weeks").select("week_start, checks").gte("week_start", weekFrom).lte("week_start", to).order("week_start").limit(60)),
    rows<YearData["journal"][number]>(db.from("journal_entries").select("day, body, gratitude, photos").gte("day", from).lte("day", to).order("day").limit(400)),
    rows<{ done_at: string }>(db.from("todos").select("done_at").eq("done", true).gte("done_at", `${from}T00:00:00`).lte("done_at", `${to}T23:59:59`).limit(5000)),
    rows<{ id: string }>(db.from("events").select("id").gte("day", from).lte("day", to).limit(5000)),
    rows<YearData["goals"][number]>(db.from("goals").select("title, milestones")),
    rows<{ kind: string; amount: number }>(db.from("transactions").select("kind, amount").gte("day", from).lte("day", to).limit(10000)),
    rows<{ start_balance: number; balance: number }>(db.from("debts").select("start_balance, balance")),
    rows<{ saved: number }>(db.from("savings_goals").select("saved")),
    rows<{ day: string; amount: number }>(db.from("biz_income").select("day, amount").gte("day", from).lte("day", to).limit(10000)),
    rows<{ debt_paid: number; status: string }>(db.from("biz_clients").select("debt_paid, status")),
    rows<{ status: string; post_day: string | null }>(db.from("content_items").select("status, post_day").eq("status", "Posted").gte("post_day", from).lte("post_day", to)),
    rows<{ day: string; done: boolean }>(db.from("biz_launches").select("day, done").eq("done", true).gte("day", from).lte("day", to)),
  ]);

  const n = (v: unknown) => Number(v ?? 0);
  return {
    days: days.map((d) => ({ ...d, wins: d.wins ?? [], priorities: d.priorities ?? [] })),
    weeks,
    journal: journal.map((j) => ({ ...j, gratitude: j.gratitude ?? [], photos: j.photos ?? [] })),
    todosDone: todos.length,
    events: events.length,
    goals,
    spent: txns.filter((t) => t.kind === "expense").reduce((a, t) => a + n(t.amount), 0),
    received: txns.filter((t) => t.kind === "income").reduce((a, t) => a + n(t.amount), 0),
    debtsPaid: debts.reduce((a, d) => a + Math.max(0, n(d.start_balance) - n(d.balance)), 0),
    savingsSaved: savings.reduce((a, s) => a + n(s.saved), 0),
    bizIncome: biz.map((b) => ({ day: b.day, amount: n(b.amount) })),
    clientDebtPaid: clients.reduce((a, c) => a + n(c.debt_paid), 0),
    clientsHelped: clients.filter((c) => c.status === "Active" || c.status === "Past").length,
    posted: content.length,
    launches: launches.length,
  };
}
