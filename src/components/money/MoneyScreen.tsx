"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { AppShell, useShell } from "../shell/AppShell";
import { CardHeader } from "../home/CardHeader";
import { PaychecksCard } from "./PaychecksCard";
import { DeleteButton, MonthNav, Progress, parseMoney } from "../ui";
import {
  addBill, addDebt, addSaving, addTxn, deleteBill, deleteDebt, deleteSaving, deleteTxn, getBudget, listBills, listDebts,
  listSavings, listTxns, monthKey, saveBudget, setBillPaid, setDebtBalance, setSaved, usd, useRows,
  type Budget, type Category,
} from "@/lib/money";
import { MONTHS, WEEKDAYS, isoDate } from "@/lib/dates";
import { heartBurst } from "@/lib/hearts";

export function MoneyScreen({ now }: { now: Date }) {
  return (
    <AppShell title="Personal finance" crumb="Money">
      <MoneyBody now={now} />
    </AppShell>
  );
}

const shortDate = (s: string) => {
  const d = new Date(`${s}T12:00:00`);
  return `${WEEKDAYS[d.getDay()].slice(0, 3)}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
};

function MoneyBody({ now }: { now: Date }) {
  const { toast } = useShell();
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const mk = monthKey(month);
  const from = isoDate(month);
  const to = isoDate(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  const isCurrent = mk === monthKey(now);

  const budget = useRows(() => getBudget(mk), [mk]);
  const txns = useRows(() => listTxns(from, to), [from, to]);
  const bills = useRows(listBills, []);
  const savings = useRows(listSavings, []);
  const debts = useRows(listDebts, []);
  const [editingBudget, setEditingBudget] = useState(false);
  const [kind, setKind] = useState<"expense" | "income">("expense");

  const failed = budget.failed || txns.failed || bills.failed || savings.failed || debts.failed;
  const oops = () => toast("That didn't save. Check your internet connection and try again.");
  async function run(fn: () => Promise<void>, ok: string, after: () => void) {
    try {
      await fn();
      if (ok) toast(ok);
    } catch {
      oops();
    }
    after();
  }

  const b = budget.data;
  const list = txns.data ?? [];
  const spent = list.filter((t) => t.kind === "expense").reduce((a, t) => a + t.amount, 0);
  const received = list.filter((t) => t.kind === "income").reduce((a, t) => a + t.amount, 0);
  const byCat = new Map<string, number>();
  for (const t of list) if (t.kind === "expense") byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
  const left = (b?.income ?? 0) - spent;

  function updateBudget(next: Budget) {
    budget.setData(next);
    saveBudget(next).catch(() =>
      toast(next.paychecks ? "That didn't save. If this is your first time using paycheck budgets, run supabase/phase9.sql in Supabase." : "That didn't save. Check your internet connection and try again."),
    );
  }

  function markBillPaid(billId: string, paid: boolean) {
    const all = bills.data ?? [];
    const bill = all.find((x) => x.id === billId);
    if (!bill) return;
    const next = paid ? [...new Set([...bill.paid_months, mk])] : bill.paid_months.filter((m) => m !== mk);
    bills.setData(all.map((x) => (x.id === billId ? { ...x, paid_months: next } : x)));
    setBillPaid(billId, next).catch(oops);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Personal finance</span>
          <h2 className="page-title">Money, honey</h2>
        </div>
        <MonthNav month={month} current={now} onChange={setMonth} />
      </div>

      {failed && <p className="auth-err">Some of your money details couldn&apos;t load. Check your internet connection, then refresh. If this is your first time here, run <b>supabase/phase4.sql</b> in Supabase.</p>}

      {b && (
        <div className="stats money-stats">
          <div className="stat">
            <small>Planned income</small>
            <b>{usd(b.income)}</b>
          </div>
          <div className="stat"><small>Received</small><b>{usd(received)}</b></div>
          <div className="stat"><small>Spent</small><b>{usd(spent)}</b></div>
          <div className={`stat hl${left < 0 ? " neg" : ""}`}><small>{left < 0 ? "Over by" : "Left to spend"}</small><b>{usd(Math.abs(left))}</b></div>
        </div>
      )}

      <div className="mgrid">
        {b && (
          <PaychecksCard budget={b} bills={bills.data ?? []} monthKey={mk} monthName={MONTHS[month.getMonth()]}
            onChange={updateBudget} onBillPaid={markBillPaid} toast={toast} />
        )}
        {/* Budget categories */}
        <section className="card" style={{ gridArea: "budget" }} aria-labelledby="h-budget">
          <CardHeader id="h-budget" icon="coin" eyebrow={`${MONTHS[month.getMonth()]} plan`} title="Budget" />
          {b && !editingBudget && (
            <div className="rows">
              {b.categories.map((c) => {
                const s = byCat.get(c.name) ?? 0;
                return (
                  <div className="row" key={c.name}>
                    <div className="lbl"><span>{c.name}</span><span className={s > c.limit ? "over" : ""}>{usd(s)} of {usd(c.limit)}</span></div>
                    <Progress value={s} max={c.limit} tone={s > c.limit ? "over" : undefined} />
                  </div>
                );
              })}
              {[...byCat.keys()].filter((k) => !b.categories.some((c) => c.name === k)).map((k) => (
                <div className="row" key={k}>
                  <div className="lbl"><span>{k} <small className="muted">(not in budget)</small></span><span>{usd(byCat.get(k)!)}</span></div>
                </div>
              ))}
            </div>
          )}
          {b && editingBudget && <BudgetEditor budget={b} onSave={(nb) => { updateBudget(nb); setEditingBudget(false); toast("Budget saved."); }} />}
          {b && !editingBudget && (
            <div className="card-foot"><button type="button" className="btn ghost sm" onClick={() => setEditingBudget(true)}>Edit budget</button></div>
          )}
        </section>

        {/* Add + list transactions */}
        <section className="card" style={{ gridArea: "txns" }} aria-labelledby="h-txns">
          <CardHeader id="h-txns" icon="plus" eyebrow="Track it" title="Spending & income" meta={<><b>{list.length}</b>this month</>} />
          <div className="seg" role="tablist" aria-label="Type">
            <button type="button" role="tab" aria-selected={kind === "expense"} className={kind === "expense" ? "on" : ""} onClick={() => setKind("expense")}>Spent</button>
            <button type="button" role="tab" aria-selected={kind === "income"} className={kind === "income" ? "on" : ""} onClick={() => setKind("income")}>Received</button>
          </div>
          <form className="pform" onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const f = new FormData(form);
            const amount = parseMoney(f.get("amount"));
            if (!amount) return toast("Enter an amount, like 24.99.");
            run(() => addTxn({ day: String(f.get("day")), kind, amount, category: kind === "income" ? String(f.get("source") || "Income") : String(f.get("category")), note: String(f.get("note") || "").trim() || null }),
              kind === "expense" ? "Spending added." : "Income added.", () => { form.reset(); txns.reload(); });
          }}>
            <label>Amount<input id="txn-amount" name="amount" inputMode="decimal" placeholder="$0.00" required /></label>
            <label>Date<input id="txn-day" name="day" type="date" defaultValue={isCurrent ? isoDate(now) : from} min={from} max={to} key={from} required /></label>
            {kind === "expense" ? (
              <label className="full">Category
                <select id="txn-cat" name="category" key={(b?.categories ?? []).map((c) => c.name).join("|")}>{(b?.categories ?? []).map((c) => <option key={c.name}>{c.name}</option>)}<option>Other</option></select>
              </label>
            ) : (
              <label className="full">Source<input id="txn-source" name="source" placeholder="Paycheck, Money & Grace Co.…" maxLength={60} /></label>
            )}
            <label className="full">Note <small>(optional)</small><input id="txn-note" name="note" placeholder="Target run" maxLength={120} /></label>
            <div className="form-actions full"><button type="submit" className="btn">{kind === "expense" ? "Add spending" : "Add income"}</button></div>
          </form>
          {txns.data && list.length === 0 && <p className="empty">Nothing logged for {MONTHS[month.getMonth()]} yet.</p>}
          <ul className="txn-list">
            {list.slice(0, 40).map((t) => (
              <li key={t.id}>
                <div className="todo-main">
                  <span className="todo-title">{t.note || t.category}</span>
                  <span className="todo-meta"><span className="tag-pill">{t.category}</span><span>{shortDate(t.day)}</span></span>
                </div>
                <b className={`amt ${t.kind}`}>{t.kind === "income" ? "+" : "−"}{usd(t.amount, true)}</b>
                <DeleteButton label={`Delete ${t.category} ${usd(t.amount, true)}`} onConfirm={() => {
                  txns.setData(list.filter((x) => x.id !== t.id));
                  run(() => deleteTxn(t.id), "Deleted.", () => {});
                }} />
              </li>
            ))}
          </ul>
        </section>

        <BillsCard monthKey={mk} month={month} now={now} bills={bills} run={run} />
        <SavingsCard savings={savings} run={run} />
        <DebtsCard debts={debts} run={run} />
      </div>
    </>
  );
}

type Run = (fn: () => Promise<void>, ok: string, after: () => void) => Promise<void>;

function BudgetEditor({ budget, onSave }: { budget: Budget; onSave: (b: Budget) => void }) {
  const [cats, setCats] = useState<Category[]>(budget.categories);
  return (
    <form className="pform" onSubmit={(e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const clean = cats.map((c) => ({ name: c.name.trim(), limit: Math.max(0, c.limit) })).filter((c) => c.name);
      onSave({ ...budget, income: parseMoney(f.get("income")) ?? 0, categories: clean });
    }}>
      <label className="full">Planned income this month<input id="budget-income" name="income" inputMode="decimal" defaultValue={budget.income || ""} placeholder="$5,200" /></label>
      <div className="full cat-edit">
        {cats.map((c, i) => (
          <div className="cat-row" key={i}>
            <label className="sr-only" htmlFor={`cat-name-${i}`}>Category name</label>
            <input id={`cat-name-${i}`} value={c.name} maxLength={40} onChange={(e) => setCats(cats.map((x, j) => (j === i ? { ...x, name: e.currentTarget.value } : x)))} />
            <label className="sr-only" htmlFor={`cat-limit-${i}`}>Monthly limit</label>
            <input id={`cat-limit-${i}`} className="money-in" inputMode="decimal" value={c.limit || ""} placeholder="$0"
              onChange={(e) => setCats(cats.map((x, j) => (j === i ? { ...x, limit: parseMoney(e.currentTarget.value) ?? 0 } : x)))} />
            <button type="button" className="iconbtn" aria-label={`Remove ${c.name}`} onClick={() => setCats(cats.filter((_, j) => j !== i))}><Icon name="x" /></button>
          </div>
        ))}
        <button type="button" className="btn ghost sm" onClick={() => setCats([...cats, { name: "", limit: 0 }])}>Add category</button>
      </div>
      <div className="form-actions full"><button type="submit" className="btn">Save budget</button></div>
    </form>
  );
}

function BillsCard({ monthKey: mk, month, now, bills, run }: { monthKey: string; month: Date; now: Date; bills: ReturnType<typeof useRows<Awaited<ReturnType<typeof listBills>>>>; run: Run }) {
  const [adding, setAdding] = useState(false);
  const list = bills.data ?? [];
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const isCurrent = mk === monthKey(now);
  const unpaid = list.filter((b) => !b.paid_months.includes(mk)).reduce((a, b) => a + b.amount, 0);
  return (
    <section className="card" style={{ gridArea: "bills" }} aria-labelledby="h-bills">
      <CardHeader id="h-bills" icon="calendar" eyebrow={MONTHS[month.getMonth()]} title="Bills" meta={<><b>{usd(unpaid)}</b>still to pay</>} />
      {bills.data && list.length === 0 && !adding && <p className="empty">Add your regular bills and tick them off each month.</p>}
      <ul className="txn-list">
        {list.map((b) => {
          const paid = b.paid_months.includes(mk);
          const due = Math.min(b.due_day, daysIn);
          const daysLeft = isCurrent ? due - now.getDate() : null;
          const status = paid ? "Paid" : daysLeft === null ? `Due the ${due}${["th", "st", "nd", "rd"][due % 10 > 3 || [11, 12, 13].includes(due) ? 0 : due % 10]}` : daysLeft < 0 ? "Overdue" : daysLeft === 0 ? "Due today" : `Due in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`;
          return (
            <li key={b.id} className={paid ? "done" : ""}>
              <button type="button" className={`chk${paid ? " on" : ""}`} aria-pressed={paid} aria-label={`Mark ${b.name} ${paid ? "unpaid" : "paid"} for ${MONTHS[month.getMonth()]}`}
                onClick={(e) => {
                  const next = paid ? b.paid_months.filter((m) => m !== mk) : [...b.paid_months, mk];
                  bills.setData(list.map((x) => (x.id === b.id ? { ...x, paid_months: next } : x)));
                  if (!paid) heartBurst(e.currentTarget);
                  run(() => setBillPaid(b.id, next), "", () => {});
                }}>
                <Icon name="check" strokeWidth={2.4} />
              </button>
              <div className="todo-main">
                <span className="todo-title">{b.name}</span>
                <span className="todo-meta">
                  <span className={!paid && daysLeft !== null && daysLeft < 0 ? "overdue" : ""}>{status}</span>
                  {b.autopay && <span className="tag-pill">Autopay</span>}
                </span>
              </div>
              <b className="amt">{usd(b.amount, true)}</b>
              <DeleteButton label={`Delete bill ${b.name}`} onConfirm={() => run(() => deleteBill(b.id), "Bill deleted.", bills.reload)} />
            </li>
          );
        })}
      </ul>
      {adding ? (
        <form className="pform" onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const amount = parseMoney(f.get("amount")) ?? 0;
          run(() => addBill({ name: String(f.get("name")).trim(), amount, due_day: Number(f.get("due")), autopay: f.get("autopay") === "on" }), "Bill added.", () => { setAdding(false); bills.reload(); });
        }}>
          <label className="full">Bill<input id="bill-name" name="name" placeholder="Phone" maxLength={60} required autoFocus /></label>
          <label>Amount<input id="bill-amount" name="amount" inputMode="decimal" placeholder="$65.00" required /></label>
          <label>Due day of month<input id="bill-due" name="due" type="number" min={1} max={31} placeholder="12" required /></label>
          <label className="check-line full"><input id="bill-autopay" name="autopay" type="checkbox" /> Paid automatically (autopay)</label>
          <div className="form-actions full">
            <button type="button" className="btn ghost" onClick={() => setAdding(false)}>Cancel</button>
            <button type="submit" className="btn">Add bill</button>
          </div>
        </form>
      ) : (
        <div className="card-foot"><button type="button" className="btn ghost sm" onClick={() => setAdding(true)}>Add a bill</button></div>
      )}
    </section>
  );
}

function SavingsCard({ savings, run }: { savings: ReturnType<typeof useRows<Awaited<ReturnType<typeof listSavings>>>>; run: Run }) {
  const [adding, setAdding] = useState(false);
  const list = savings.data ?? [];
  return (
    <section className="card" style={{ gridArea: "savings" }} aria-labelledby="h-save">
      <CardHeader id="h-save" icon="sparkle" eyebrow="Dream big" title="Savings goals" />
      {savings.data && list.length === 0 && !adding && <p className="empty">Add a savings goal, like a Paris fund or an emergency fund.</p>}
      <div className="rows">
        {list.map((s) => (
          <div className="save-goal" key={s.id}>
            <div className="lbl"><b>{s.name}</b><span>{usd(s.saved)} of {usd(s.target)}</span></div>
            <Progress value={s.saved} max={s.target} tone="gold" />
            <form className="inline-add" onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem("add") as HTMLInputElement;
              const amt = parseMoney(input.value);
              if (!amt) return;
              input.value = "";
              const saved = Math.round((s.saved + amt) * 100) / 100;
              savings.setData(list.map((x) => (x.id === s.id ? { ...x, saved } : x)));
              run(() => setSaved(s.id, saved), saved >= s.target ? "Goal reached! Treat yourself (within budget)." : `Added ${usd(amt, true)}.`, () => {});
            }}>
              <label className="sr-only" htmlFor={`add-${s.id}`}>Add money to {s.name}</label>
              <input id={`add-${s.id}`} name="add" inputMode="decimal" placeholder="Add $" />
              <button type="submit" className="btn ghost sm">Add</button>
              <DeleteButton label={`Delete goal ${s.name}`} onConfirm={() => run(() => deleteSaving(s.id), "Goal deleted.", savings.reload)} />
            </form>
          </div>
        ))}
      </div>
      {adding ? (
        <form className="pform" onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const target = parseMoney(f.get("target"));
          if (!target) return;
          run(() => addSaving({ name: String(f.get("name")).trim(), target, saved: parseMoney(f.get("saved")) ?? 0 }), "Goal added.", () => { setAdding(false); savings.reload(); });
        }}>
          <label className="full">Goal<input id="save-name" name="name" placeholder="Paris fund" maxLength={60} required autoFocus /></label>
          <label>Target<input id="save-target" name="target" inputMode="decimal" placeholder="$3,000" required /></label>
          <label>Saved so far<input id="save-saved" name="saved" inputMode="decimal" placeholder="$0" /></label>
          <div className="form-actions full">
            <button type="button" className="btn ghost" onClick={() => setAdding(false)}>Cancel</button>
            <button type="submit" className="btn">Add goal</button>
          </div>
        </form>
      ) : (
        <div className="card-foot"><button type="button" className="btn ghost sm" onClick={() => setAdding(true)}>Add a savings goal</button></div>
      )}
    </section>
  );
}

function DebtsCard({ debts, run }: { debts: ReturnType<typeof useRows<Awaited<ReturnType<typeof listDebts>>>>; run: Run }) {
  const [adding, setAdding] = useState(false);
  const list = debts.data ?? [];
  const start = list.reduce((a, d) => a + d.start_balance, 0);
  const now = list.reduce((a, d) => a + d.balance, 0);
  const focus = list.filter((d) => d.balance > 0).sort((a, b) => a.balance - b.balance)[0];
  return (
    <section className="card" style={{ gridArea: "debts" }} aria-labelledby="h-debt">
      <CardHeader id="h-debt" icon="heart" eyebrow="Debt-free journey" title="Debt payoff" meta={start > 0 ? <><b>{usd(start - now)}</b>paid off</> : undefined} />
      {start > 0 && (
        <div className="row">
          <div className="lbl"><span>Total paid off</span><span>{Math.round(((start - now) / start) * 100)}% · {usd(now)} to go</span></div>
          <Progress value={start - now} max={start} tone="gold" />
        </div>
      )}
      {debts.data && list.length === 0 && !adding && <p className="empty">List each debt with its starting balance. Update the balance after each payment and watch it shrink.</p>}
      <ul className="txn-list">
        {list.map((d) => (
          <li key={d.id} className={d.balance === 0 ? "done" : ""}>
            <div className="todo-main">
              <span className="todo-title">{d.name} {focus?.id === d.id && <span className="tag-pill focus">Focus debt</span>}{d.balance === 0 && <span className="tag-pill">Paid off!</span>}</span>
              <span className="todo-meta">
                <span>{usd(d.balance, true)} left of {usd(d.start_balance)}</span>
                {d.apr !== null && <span>{d.apr}% APR</span>}
                {d.min_payment !== null && <span>min {usd(d.min_payment)}</span>}
              </span>
              <Progress value={d.start_balance - d.balance} max={d.start_balance} />
            </div>
            <form className="inline-add" onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem("bal") as HTMLInputElement;
              const v = input.value.trim() === "0" ? 0 : parseMoney(input.value);
              if (v === null) return;
              input.value = "";
              debts.setData(list.map((x) => (x.id === d.id ? { ...x, balance: v } : x)));
              run(() => setDebtBalance(d.id, v), v === 0 ? `${d.name} is paid off! So proud of you.` : "Balance updated.", () => {});
            }}>
              <label className="sr-only" htmlFor={`bal-${d.id}`}>New balance for {d.name}</label>
              <input id={`bal-${d.id}`} name="bal" inputMode="decimal" placeholder="New balance" />
              <button type="submit" className="btn ghost sm">Update</button>
            </form>
            <DeleteButton label={`Delete debt ${d.name}`} onConfirm={() => run(() => deleteDebt(d.id), "Debt removed.", debts.reload)} />
          </li>
        ))}
      </ul>
      {focus && list.length > 1 && <p className="hint-sm">Focus debt: the smallest balance (the snowball method). Pay minimums on the rest and put extra here.</p>}
      {adding ? (
        <form className="pform" onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const bal = parseMoney(f.get("balance"));
          if (!bal) return;
          const apr = Number(String(f.get("apr") || "").replace(/%/g, ""));
          run(() => addDebt({ name: String(f.get("name")).trim(), start_balance: bal, balance: bal, apr: f.get("apr") ? apr : null, min_payment: parseMoney(f.get("min")) }), "Debt added. You've got this.", () => { setAdding(false); debts.reload(); });
        }}>
          <label className="full">Debt<input id="debt-name" name="name" placeholder="Chase credit card" maxLength={60} required autoFocus /></label>
          <label>Balance today<input id="debt-balance" name="balance" inputMode="decimal" placeholder="$2,400" required /></label>
          <label>APR <small>(optional)</small><input id="debt-apr" name="apr" inputMode="decimal" placeholder="24.99" /></label>
          <label>Minimum payment <small>(optional)</small><input id="debt-min" name="min" inputMode="decimal" placeholder="$75" /></label>
          <div className="form-actions full">
            <button type="button" className="btn ghost" onClick={() => setAdding(false)}>Cancel</button>
            <button type="submit" className="btn">Add debt</button>
          </div>
        </form>
      ) : (
        <div className="card-foot"><button type="button" className="btn ghost sm" onClick={() => setAdding(true)}>Add a debt</button></div>
      )}
    </section>
  );
}
