"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { CardHeader } from "../home/CardHeader";
import { DeleteButton, Progress, parseMoney } from "../ui";
import { defaultPaychecks, usd, type Bill, type Budget, type Paycheck } from "@/lib/money";
import { newId } from "@/lib/settings";
import { heartBurst } from "@/lib/hearts";

const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;

type Props = {
  budget: Budget;
  bills: Bill[];
  monthKey: string;
  monthName: string;
  onChange: (b: Budget) => void;
  onBillPaid: (billId: string, paid: boolean) => void;
  toast: (m: string) => void;
};

export function PaychecksCard({ budget, bills, monthKey, monthName, onChange, onBillPaid, toast }: Props) {
  const paychecks = budget.paychecks ?? defaultPaychecks(budget.income);
  const [editing, setEditing] = useState<string | null>(null);

  const save = (next: Paycheck[]) => onChange({ ...budget, paychecks: next });
  const patch = (id: string, fn: (p: Paycheck) => Paycheck) => save(paychecks.map((p) => (p.id === id ? fn(p) : p)));

  /** Puts each bill on the paycheck that arrives most recently before it's due.
   *  Bills due before the first payday go on the last paycheck (it covers next month's early bills). */
  function fillFromBills() {
    const assigned = new Set(paychecks.flatMap((p) => p.items.map((i) => i.billId).filter(Boolean)));
    const sorted = [...paychecks].sort((a, b) => a.day - b.day);
    const toAdd = bills.filter((b) => !assigned.has(b.id));
    if (!toAdd.length) return toast(bills.length ? "Every bill is already on a paycheck." : "Add your bills below first, then fill your paychecks from them.");
    const next = paychecks.map((p) => ({ ...p, items: [...p.items] }));
    for (const b of toAdd) {
      const target = [...sorted].reverse().find((p) => p.day <= b.due_day) ?? sorted[sorted.length - 1];
      next.find((p) => p.id === target.id)!.items.push({ id: newId("i"), name: b.name, amount: b.amount, done: b.paid_months.includes(monthKey), billId: b.id });
    }
    save(next);
    toast(`Added ${toAdd.length} ${toAdd.length === 1 ? "bill" : "bills"} to your paychecks.`);
  }

  const total = paychecks.reduce((a, p) => a + p.amount, 0);

  return (
    <section className="card" style={{ gridArea: "paychecks" }} aria-labelledby="h-pay">
      <CardHeader id="h-pay" icon="coin" eyebrow={`${monthName} paychecks`} title="Paycheck budgets" meta={<><b>{usd(total)}</b>coming in</>} />
      <p className="lede-sm">Give every dollar of each paycheck a job. Put each bill and spending amount on the paycheck that pays it, and see what&apos;s left over.</p>

      <div className="pay-grid">
        {paychecks.map((p) => {
          const assignedAmt = p.items.reduce((a, i) => a + i.amount, 0);
          const left = Math.round((p.amount - assignedAmt) * 100) / 100;
          const doneCount = p.items.filter((i) => i.done).length;
          return (
            <div className="paycheck" key={p.id}>
              {editing === p.id ? (
                <form className="pform" onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  patch(p.id, (x) => ({
                    ...x,
                    name: String(f.get("name")).trim() || x.name,
                    day: Math.min(31, Math.max(1, Number(f.get("day")) || x.day)),
                    amount: parseMoney(f.get("amount")) ?? 0,
                  }));
                  setEditing(null);
                }}>
                  <label className="full">Name<input id={`pc-name-${p.id}`} name="name" defaultValue={p.name} maxLength={40} required autoFocus /></label>
                  <label>Payday (day of month)<input id={`pc-day-${p.id}`} name="day" type="number" min={1} max={31} defaultValue={p.day} /></label>
                  <label>Take-home amount<input id={`pc-amt-${p.id}`} name="amount" inputMode="decimal" defaultValue={p.amount || ""} placeholder="$2,600" /></label>
                  <div className="form-actions full">
                    <button type="button" className="btn ghost sm" onClick={() => setEditing(null)}>Cancel</button>
                    <button type="submit" className="btn sm">Save</button>
                  </div>
                </form>
              ) : (
                <div className="pay-head">
                  <div>
                    <h3>{p.name}</h3>
                    <span className="muted">Payday: the {ordinal(p.day)}</span>
                  </div>
                  <div className="pay-amt">
                    <b>{usd(p.amount, true)}</b>
                    <button type="button" className="btn ghost sm" onClick={() => setEditing(p.id)}>Edit</button>
                  </div>
                </div>
              )}

              <div className="pay-sum">
                <Progress value={assignedAmt} max={p.amount || 1} tone={left < 0 ? "over" : undefined} />
                <div className="lbl">
                  <span>{usd(assignedAmt, true)} assigned{p.items.length ? ` · ${doneCount} of ${p.items.length} paid` : ""}</span>
                  <b className={left < 0 ? "over" : left === 0 ? "ok" : ""}>{left < 0 ? `Over by ${usd(-left, true)}` : left === 0 ? "Every dollar has a job" : `${usd(left, true)} left`}</b>
                </div>
              </div>

              {p.items.length === 0 && <p className="empty">Nothing assigned yet. Add bills and spending this paycheck covers.</p>}
              <ul className="txn-list">
                {p.items.map((i) => (
                  <li key={i.id} className={i.done ? "done" : ""}>
                    <button type="button" className={`chk${i.done ? " on" : ""}`} aria-pressed={i.done} aria-label={`Mark ${i.name} ${i.done ? "not paid" : "paid"}`}
                      onClick={(e) => {
                        if (!i.done) heartBurst(e.currentTarget);
                        patch(p.id, (x) => ({ ...x, items: x.items.map((y) => (y.id === i.id ? { ...y, done: !y.done } : y)) }));
                        if (i.billId) onBillPaid(i.billId, !i.done);
                      }}>
                      <Icon name="check" strokeWidth={2.4} />
                    </button>
                    <div className="todo-main">
                      <span className="todo-title">{i.name}</span>
                      {i.billId && <span className="todo-meta"><span className="tag-pill">Bill</span></span>}
                    </div>
                    <b className="amt">{usd(i.amount, true)}</b>
                    <DeleteButton label={`Remove ${i.name} from ${p.name}`} text="Remove?" onConfirm={() => patch(p.id, (x) => ({ ...x, items: x.items.filter((y) => y.id !== i.id) }))} />
                  </li>
                ))}
              </ul>

              <form className="ms-add pay-add" onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const f = new FormData(form);
                const name = String(f.get("name")).trim();
                const amount = parseMoney(f.get("amount"));
                if (!name || !amount) return toast("Add a name and an amount, like Groceries and 200.");
                patch(p.id, (x) => ({ ...x, items: [...x.items, { id: newId("i"), name, amount, done: false, billId: null }] }));
                form.reset();
              }}>
                <label htmlFor={`pa-name-${p.id}`} className="sr-only">What it&apos;s for</label>
                <input id={`pa-name-${p.id}`} name="name" placeholder="Groceries, savings, gas…" maxLength={60} />
                <label htmlFor={`pa-amt-${p.id}`} className="sr-only">Amount</label>
                <input id={`pa-amt-${p.id}`} name="amount" inputMode="decimal" placeholder="$0" className="pay-amt-in" />
                <button type="submit" className="iconbtn" aria-label={`Add to ${p.name}`}><Icon name="plus" /></button>
              </form>
            </div>
          );
        })}
      </div>

      <div className="card-foot wrap">
        {Math.abs(total - budget.income) >= 1 && budget.income > 0 && (
          <span className="hint-sm pay-note">Your paychecks add up to {usd(total)}; your planned income is {usd(budget.income)}.{" "}
            <button type="button" className="linkbtn" onClick={() => onChange({ ...budget, income: total, paychecks })}>Use {usd(total)} as planned income</button>
          </span>
        )}
        <button type="button" className="btn ghost sm" onClick={fillFromBills}>Fill from my bills</button>
      </div>
    </section>
  );
}
