"use client";

import { supabase } from "./supabase/client";

// "Download my data": every planner table, as one JSON file, plus a spending CSV.

export const EXPORT_TABLES = [
  "day_entries", "habit_weeks", "events", "todos", "goals", "settings", "periods", "journal_entries",
  "budgets", "transactions", "bills", "savings_goals", "debts",
  "biz_income", "biz_clients", "biz_launches", "meal_plans", "groceries", "chores",
] as const;

const PAGE = 1000;

async function allRows(table: string) {
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    const res = await supabase().from(table).select("*").range(from, from + PAGE - 1);
    if (res.error) throw new Error(`${table}: ${res.error.message}`);
    rows.push(...(res.data ?? []));
    if (!res.data || res.data.length < PAGE) break;
  }
  return rows;
}

function save(name: string, type: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const stamp = () => new Date().toISOString().slice(0, 10);

/** Downloads everything. Returns how many rows were saved. Tables that don't exist yet are skipped. */
export async function downloadEverything() {
  const tables: Record<string, Record<string, unknown>[]> = {};
  const skipped: string[] = [];
  for (const t of EXPORT_TABLES) {
    try {
      tables[t] = await allRows(t);
    } catch {
      skipped.push(t);
    }
  }
  if (skipped.length === EXPORT_TABLES.length) throw new Error("Nothing could be read");
  const total = Object.values(tables).reduce((a, r) => a + r.length, 0);
  save(
    `my-pretty-little-life-${stamp()}.json`,
    "application/json",
    JSON.stringify({ app: "My Pretty Little Life", exported_at: new Date().toISOString(), note: "Journal photos are not included; they are in the weekly photo backup.", skipped, tables }, null, 2),
  );
  return total;
}

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Spending and income as a spreadsheet (opens in Excel or Numbers). */
export async function downloadSpendingCsv() {
  const rows = (await allRows("transactions")).sort((a, b) => String(b.day).localeCompare(String(a.day)));
  const head = ["Date", "Type", "Amount", "Category", "Note"];
  const lines = rows.map((r) => [r.day, r.kind === "income" ? "Income" : "Spending", Number(r.amount).toFixed(2), r.category, r.note].map(csvCell).join(","));
  save(`spending-${stamp()}.csv`, "text/csv", [head.join(","), ...lines].join("\n"));
  return rows.length;
}
