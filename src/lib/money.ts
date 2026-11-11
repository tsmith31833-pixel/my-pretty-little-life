"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase/client";

// Money, Money & Grace Co. and Home data (tables from supabase/phase4.sql).

export const usd = (n: number, cents = false) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents ? 2 : 0, minimumFractionDigits: cents ? 2 : 0 });

export const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}
const db = () => supabase();
const num = (v: unknown) => Number(v ?? 0);

/** Loads rows and reloads when any dependency changes. */
export function useRows<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    load()
      .then((d) => live && (setData(d), setFailed(false)))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are passed in by the caller
  }, [...deps, tick]);
  return { data, setData, failed, reload: () => setTick((t) => t + 1) };
}

// ---------- personal finance ----------
export type Category = { name: string; limit: number };
export type Budget = { month: string; income: number; categories: Category[] };
export type Txn = { id: string; day: string; kind: "expense" | "income"; amount: number; category: string; note: string | null };
export type Bill = { id: string; name: string; amount: number; due_day: number; autopay: boolean; paid_months: string[] };
export type Saving = { id: string; name: string; target: number; saved: number };
export type Debt = { id: string; name: string; start_balance: number; balance: number; apr: number | null; min_payment: number | null };

export const DEFAULT_CATEGORIES: Category[] = [
  { name: "Housing", limit: 1500 },
  { name: "Groceries", limit: 450 },
  { name: "Dining out", limit: 200 },
  { name: "Beauty & self-care", limit: 120 },
  { name: "Shopping", limit: 200 },
  { name: "Transportation", limit: 250 },
  { name: "Debt payments", limit: 500 },
  { name: "Giving", limit: 100 },
];

/** This month's budget. If it doesn't exist yet, it starts from last month's (or the defaults). */
export async function getBudget(month: string): Promise<Budget> {
  const row = check<Budget | null>(await db().from("budgets").select("month, income, categories").eq("month", month).maybeSingle());
  if (row) return { ...row, income: num(row.income) };
  const prev = check<Budget | null>(
    await db().from("budgets").select("month, income, categories").lt("month", month).order("month", { ascending: false }).limit(1).maybeSingle(),
  );
  return { month, income: prev ? num(prev.income) : 0, categories: prev?.categories ?? DEFAULT_CATEGORIES };
}
export async function saveBudget(b: Budget) {
  check(await db().from("budgets").upsert(b));
}

export async function listTxns(from: string, to: string) {
  const rows = check<Txn[]>(
    await db().from("transactions").select("id, day, kind, amount, category, note").gte("day", from).lte("day", to).order("day", { ascending: false }).order("created_at", { ascending: false }),
  );
  return rows.map((r) => ({ ...r, amount: num(r.amount) }));
}
export async function addTxn(t: Omit<Txn, "id">) {
  check(await db().from("transactions").insert(t));
}
export async function deleteTxn(id: string) {
  check(await db().from("transactions").delete().eq("id", id));
}

export async function listBills() {
  const rows = check<Bill[]>(await db().from("bills").select("id, name, amount, due_day, autopay, paid_months").order("due_day"));
  return rows.map((r) => ({ ...r, amount: num(r.amount) }));
}
export async function addBill(b: Omit<Bill, "id" | "paid_months">) {
  check(await db().from("bills").insert(b));
}
export async function setBillPaid(id: string, paid_months: string[]) {
  check(await db().from("bills").update({ paid_months }).eq("id", id));
}
export async function deleteBill(id: string) {
  check(await db().from("bills").delete().eq("id", id));
}

export async function listSavings() {
  const rows = check<Saving[]>(await db().from("savings_goals").select("id, name, target, saved").order("created_at"));
  return rows.map((r) => ({ ...r, target: num(r.target), saved: num(r.saved) }));
}
export async function addSaving(s: Omit<Saving, "id">) {
  check(await db().from("savings_goals").insert(s));
}
export async function setSaved(id: string, saved: number) {
  check(await db().from("savings_goals").update({ saved }).eq("id", id));
}
export async function deleteSaving(id: string) {
  check(await db().from("savings_goals").delete().eq("id", id));
}

export async function listDebts() {
  const rows = check<Debt[]>(await db().from("debts").select("id, name, start_balance, balance, apr, min_payment").order("balance"));
  return rows.map((r) => ({ ...r, start_balance: num(r.start_balance), balance: num(r.balance), apr: r.apr === null ? null : num(r.apr), min_payment: r.min_payment === null ? null : num(r.min_payment) }));
}
export async function addDebt(d: Omit<Debt, "id">) {
  check(await db().from("debts").insert(d));
}
export async function setDebtBalance(id: string, balance: number) {
  check(await db().from("debts").update({ balance }).eq("id", id));
}
export async function deleteDebt(id: string) {
  check(await db().from("debts").delete().eq("id", id));
}

// ---------- Money & Grace Co. ----------
export type BizIncome = { id: string; day: string; amount: number; offer: string; client: string | null };
export type ClientStatus = "Lead" | "Call booked" | "Active" | "Past";
export const CLIENT_STATUSES: ClientStatus[] = ["Lead", "Call booked", "Active", "Past"];
export type BizClient = { id: string; name: string; status: ClientStatus; offer: string | null; debt_paid: number; notes: string | null };
export type Launch = { id: string; name: string; day: string; done: boolean };
export type BizGoals = { revenueGoal: number; debtGoal: number; community: number };
export const DEFAULT_BIZ_GOALS: BizGoals = { revenueGoal: 6000, debtGoal: 75000, community: 0 };
export const OFFERS = ["Coaching", "Workshop", "Course", "Digital product", "Speaking", "Affiliate", "Other"];

export async function listBizIncome(from: string, to: string) {
  const rows = check<BizIncome[]>(await db().from("biz_income").select("id, day, amount, offer, client").gte("day", from).lte("day", to).order("day", { ascending: false }));
  return rows.map((r) => ({ ...r, amount: num(r.amount) }));
}
export async function addBizIncome(i: Omit<BizIncome, "id">) {
  check(await db().from("biz_income").insert(i));
}
export async function deleteBizIncome(id: string) {
  check(await db().from("biz_income").delete().eq("id", id));
}
export async function listClients() {
  const rows = check<BizClient[]>(await db().from("biz_clients").select("id, name, status, offer, debt_paid, notes").order("created_at", { ascending: false }));
  return rows.map((r) => ({ ...r, debt_paid: num(r.debt_paid) }));
}
export async function addClient(c: Omit<BizClient, "id">) {
  check(await db().from("biz_clients").insert(c));
}
export async function updateClient(id: string, patch: Partial<Omit<BizClient, "id">>) {
  check(await db().from("biz_clients").update(patch).eq("id", id));
}
export async function deleteClient(id: string) {
  check(await db().from("biz_clients").delete().eq("id", id));
}
export async function listLaunches() {
  return check<Launch[]>(await db().from("biz_launches").select("id, name, day, done").order("day"));
}
export async function addLaunch(l: Omit<Launch, "id" | "done">) {
  check(await db().from("biz_launches").insert(l));
}
export async function setLaunchDone(id: string, done: boolean) {
  check(await db().from("biz_launches").update({ done }).eq("id", id));
}
export async function deleteLaunch(id: string) {
  check(await db().from("biz_launches").delete().eq("id", id));
}
export async function getBizGoals(): Promise<BizGoals> {
  const row = check<{ business: Partial<BizGoals> | null } | null>(await db().from("settings").select("business").maybeSingle());
  return { ...DEFAULT_BIZ_GOALS, ...(row?.business ?? {}) };
}
export async function saveBizGoals(g: BizGoals) {
  // Only the business column is written; habits and routines are left as they are.
  const existing = check<{ user_id: string } | null>(await db().from("settings").select("user_id").maybeSingle());
  if (existing) check(await db().from("settings").update({ business: g }).eq("user_id", existing.user_id));
  else check(await db().from("settings").insert({ business: g }));
}

// ---------- Home ----------
export const MEALS = ["Breakfast", "Lunch", "Dinner"] as const;
export type MealWeek = Record<string, Partial<Record<(typeof MEALS)[number], string>>>;
export type Grocery = { id: string; name: string; aisle: string; done: boolean };
export const AISLES = ["Produce", "Dairy & eggs", "Meat & fish", "Pantry", "Frozen", "Bakery", "Drinks", "Household", "Beauty", "Other"];
export type Chore = { id: string; name: string; room: string; every_days: number; last_done: string | null };

export async function getMeals(weekStart: string) {
  const row = check<{ meals: MealWeek } | null>(await db().from("meal_plans").select("meals").eq("week_start", weekStart).maybeSingle());
  return row?.meals ?? {};
}
export async function saveMeals(weekStart: string, meals: MealWeek) {
  check(await db().from("meal_plans").upsert({ week_start: weekStart, meals }));
}
export async function listGroceries() {
  return check<Grocery[]>(await db().from("groceries").select("id, name, aisle, done").order("done").order("aisle").order("created_at"));
}
export async function addGrocery(g: { name: string; aisle: string }) {
  check(await db().from("groceries").insert(g));
}
export async function setGroceryDone(id: string, done: boolean) {
  check(await db().from("groceries").update({ done }).eq("id", id));
}
export async function clearDoneGroceries() {
  check(await db().from("groceries").delete().eq("done", true));
}
export async function deleteGrocery(id: string) {
  check(await db().from("groceries").delete().eq("id", id));
}
export async function listChores() {
  return check<Chore[]>(await db().from("chores").select("id, name, room, every_days, last_done").order("room").order("name"));
}
export async function addChore(c: Omit<Chore, "id">) {
  check(await db().from("chores").insert(c));
}
export async function markChoreDone(id: string, day: string | null) {
  check(await db().from("chores").update({ last_done: day }).eq("id", id));
}
export async function deleteChore(id: string) {
  check(await db().from("chores").delete().eq("id", id));
}

// ---------- Money & Grace Co. content bank (supabase/phase6.sql) ----------
export const CONTENT_STATUSES = ["Idea", "Drafted", "Scheduled", "Posted"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];
export const PLATFORMS = ["Instagram", "TikTok", "YouTube", "Facebook", "Pinterest", "Threads", "LinkedIn", "Email", "Blog"];
export const FORMATS = ["Reel", "Carousel", "Static post", "Story", "Short", "Long video", "Live", "Email", "Blog post"];
export const PILLARS = ["Debt payoff tips", "Budgeting", "Money mindset", "Client wins", "Behind the scenes", "Offers & launches", "Lifestyle", "Other"];

export type ContentItem = {
  id: string;
  title: string;
  platform: string;
  format: string;
  pillar: string;
  status: ContentStatus;
  hook: string | null;
  caption: string | null;
  hashtags: string | null;
  post_day: string | null;
};
export type NewContent = Omit<ContentItem, "id">;

const CONTENT_COLS = "id, title, platform, format, pillar, status, hook, caption, hashtags, post_day";

export async function listContent() {
  return check<ContentItem[]>(
    await db().from("content_items").select(CONTENT_COLS).order("post_day", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false }),
  );
}
export async function saveContent(c: NewContent, id?: string) {
  const row = { ...c, updated_at: new Date().toISOString() };
  check(await (id ? db().from("content_items").update(row).eq("id", id) : db().from("content_items").insert(row)));
}
export async function updateContent(id: string, patch: Partial<NewContent>) {
  check(await db().from("content_items").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id));
}
export async function deleteContent(id: string) {
  check(await db().from("content_items").delete().eq("id", id));
}
