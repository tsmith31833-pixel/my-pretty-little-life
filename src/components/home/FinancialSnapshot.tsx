"use client";

import Link from "next/link";
import { Icon } from "../Icon";
import { CardHeader } from "./CardHeader";
import { Progress } from "../ui";
import { getBudget, listBills, listSavings, listTxns, monthKey, usd, useRows } from "@/lib/money";
import { MONTHS, WEEKDAYS, isoDate } from "@/lib/dates";

export function FinancialSnapshot({ now }: { now: Date }) {
  const mk = monthKey(now);
  const from = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const to = isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const budget = useRows(() => getBudget(mk), [mk]);
  const txns = useRows(() => listTxns(from, to), [from, to]);
  const bills = useRows(listBills, []);
  const savings = useRows(listSavings, []);

  const failed = budget.failed || txns.failed || bills.failed || savings.failed;
  const ready = budget.data && txns.data && bills.data && savings.data;
  const spent = (txns.data ?? []).filter((t) => t.kind === "expense").reduce((a, t) => a + t.amount, 0);
  const byCat = new Map<string, number>();
  for (const t of txns.data ?? []) if (t.kind === "expense") byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
  const income = budget.data?.income ?? 0;
  const left = income - spent;
  // Show the three categories closest to their limit.
  const cats = (budget.data?.categories ?? [])
    .filter((c) => c.limit > 0)
    .map((c) => ({ ...c, spent: byCat.get(c.name) ?? 0 }))
    .sort((a, b) => b.spent / b.limit - a.spent / a.limit)
    .slice(0, 3);
  const goal = savings.data?.[0];
  const daysIn = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const nextBill = (bills.data ?? [])
    .filter((b) => !b.paid_months.includes(mk))
    .map((b) => ({ ...b, day: Math.min(b.due_day, daysIn) }))
    .sort((a, b) => a.day - b.day)[0];
  const billDate = nextBill ? new Date(now.getFullYear(), now.getMonth(), nextBill.day) : null;
  const empty = ready && income === 0 && spent === 0 && !(bills.data ?? []).length && !(savings.data ?? []).length;

  return (
    <section className="card" style={{ gridArea: "money" }} aria-labelledby="h-mon">
      <CardHeader id="h-mon" icon="coin" eyebrow={`${MONTHS[now.getMonth()]} budget`} title="Financial snapshot" />
      {failed && <p className="empty">Your money details couldn&apos;t load. <Link href="/money">Open Personal finance</Link> to check.</p>}
      {empty && <p className="empty">Set your budget, bills and savings goals in <Link href="/money">Personal finance</Link> and they&apos;ll show here.</p>}
      {ready && !empty && (
        <>
          <div className="stats">
            <div className="stat"><small>Income</small><b>{usd(income)}</b></div>
            <div className="stat"><small>Spent</small><b>{usd(spent)}</b></div>
            <div className={`stat hl${left < 0 ? " neg" : ""}`}><small>{left < 0 ? "Over" : "Left"}</small><b>{usd(Math.abs(left))}</b></div>
          </div>
          <div className="rows">
            {cats.map((c) => (
              <div className="row" key={c.name}>
                <div className="lbl"><span>{c.name}</span><span className={c.spent > c.limit ? "over" : ""}>{usd(c.spent)} of {usd(c.limit)}</span></div>
                <Progress value={c.spent} max={c.limit} tone={c.spent > c.limit ? "over" : undefined} />
              </div>
            ))}
            {goal && (
              <div className="row">
                <div className="lbl"><span>{goal.name}</span><span>{usd(goal.saved)} of {usd(goal.target)}</span></div>
                <Progress value={goal.saved} max={goal.target} tone="gold" />
              </div>
            )}
          </div>
          {nextBill && billDate && (
            <div className="bill">
              <Icon name="calendar" />
              <div><b>{nextBill.name}</b> due {WEEKDAYS[billDate.getDay()].slice(0, 3)}, {MONTHS[billDate.getMonth()].slice(0, 3)} {billDate.getDate()}</div>
              <span className="amt">{usd(nextBill.amount, true)}</span>
            </div>
          )}
        </>
      )}
      <Link className="see-all" href="/money">Open Personal finance</Link>
    </section>
  );
}
