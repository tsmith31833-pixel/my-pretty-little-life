"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { AppShell, useShell } from "../shell/AppShell";
import { CardHeader } from "../home/CardHeader";
import { DeleteButton, MonthNav, Progress, parseMoney } from "../ui";
import {
  CLIENT_STATUSES, OFFERS, addBizIncome, addClient, addLaunch, deleteBizIncome, deleteClient, deleteLaunch, getBizGoals,
  listBizIncome, listClients, listLaunches, monthKey, saveBizGoals, setLaunchDone, updateClient, usd, useRows,
  type BizClient, type BizGoals, type ClientStatus,
} from "@/lib/money";
import { MONTHS, WEEKDAYS, isoDate } from "@/lib/dates";
import { heartBurst } from "@/lib/hearts";

export function BusinessScreen({ now }: { now: Date }) {
  return (
    <AppShell title="Money & Grace Co." crumb="Your business">
      <BusinessBody now={now} />
    </AppShell>
  );
}

const shortDate = (s: string) => {
  const d = new Date(`${s}T12:00:00`);
  return `${WEEKDAYS[d.getDay()].slice(0, 3)}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
};

/** Revenue per month for the 6 months ending with `end` (sample-free: from your income log). */
function RevenueBars({ months, goal }: { months: { label: string; total: number }[]; goal: number }) {
  const W = 420, H = 150, l = 44, r = 8, t = 12, b = 22;
  const max = Math.max(goal, ...months.map((m) => m.total), 1) * 1.1;
  const y = (v: number) => t + (1 - v / max) * (H - t - b);
  const cw = (W - l - r) / months.length;
  const bw = Math.min(28, cw - 10);
  const k = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `$${Math.round(v)}`);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="trend-svg" role="img" aria-label={`Revenue for the last six months: ${months.map((m) => `${m.label} ${usd(m.total)}`).join(", ")}`}>
      {[0, max / 2].map((v) => (
        <g key={v}>
          <line x1={l} x2={W - r} y1={y(v)} y2={y(v)} stroke="var(--line)" />
          <text x={l - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="var(--muted)">{k(v)}</text>
        </g>
      ))}
      {goal > 0 && (
        <g>
          <line x1={l} x2={W - r} y1={y(goal)} y2={y(goal)} stroke="var(--gold)" strokeDasharray="3 4" strokeWidth="1.2" />
          <text x={l - 6} y={y(goal) + 3} textAnchor="end" fontSize="9" fill="var(--gold-text)">Goal</text>
        </g>
      )}
      {months.map((m, i) => {
        const cx = l + cw * i + cw / 2;
        const h = m.total > 0 ? Math.max(3, y(0) - y(m.total)) : 0;
        const last = i === months.length - 1;
        return (
          <g key={m.label}>
            <rect x={cx - cw / 2} y={t} width={cw} height={H - t - b} fill="transparent"><title>{`${m.label}: ${usd(m.total)}`}</title></rect>
            {h > 0 && (
              <path pointerEvents="none" fill={last ? "var(--hot)" : "var(--rose)"}
                d={`M${cx - bw / 2} ${y(0)} V${y(0) - h + 4} Q${cx - bw / 2} ${y(0) - h} ${cx - bw / 2 + 4} ${y(0) - h} H${cx + bw / 2 - 4} Q${cx + bw / 2} ${y(0) - h} ${cx + bw / 2} ${y(0) - h + 4} V${y(0)} Z`} />
            )}
            {last && m.total > 0 && <text x={cx} y={y(m.total) - 5} textAnchor="middle" fontSize="9.5" fill="var(--ink)">{k(m.total)}</text>}
            <text x={cx} y={H - 6} textAnchor="middle" fontSize="9" fill={last ? "var(--ink)" : "var(--muted)"}>{m.label}</text>
          </g>
        );
      })}
      <line x1={l} x2={W - r} y1={y(0)} y2={y(0)} stroke="var(--muted)" opacity=".5" />
    </svg>
  );
}

function BusinessBody({ now }: { now: Date }) {
  const { toast } = useShell();
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const sixStart = new Date(month.getFullYear(), month.getMonth() - 5, 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const income = useRows(() => listBizIncome(isoDate(sixStart), isoDate(monthEnd)), [isoDate(month)]);
  const clients = useRows(listClients, []);
  const launches = useRows(listLaunches, []);
  const goals = useRows(getBizGoals, []);
  const [editGoals, setEditGoals] = useState(false);
  const [addingClient, setAddingClient] = useState(false);
  const mk = monthKey(month);
  const isCurrent = mk === monthKey(now);

  const failed = income.failed || clients.failed || launches.failed || goals.failed;
  async function run(fn: () => Promise<void>, ok: string, after: () => void) {
    try {
      await fn();
      if (ok) toast(ok);
    } catch {
      toast("That didn't save. Check your internet connection and try again.");
    }
    after();
  }

  const g: BizGoals | null = goals.data;
  const rows = income.data ?? [];
  const thisMonth = rows.filter((r) => r.day.startsWith(mk));
  const revenue = thisMonth.reduce((a, r) => a + r.amount, 0);
  const sixMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(sixStart.getFullYear(), sixStart.getMonth() + i, 1);
    const key = monthKey(d);
    return { label: MONTHS[d.getMonth()].slice(0, 3), total: rows.filter((r) => r.day.startsWith(key)).reduce((a, r) => a + r.amount, 0) };
  });
  const cl = clients.data ?? [];
  const debtPaid = cl.reduce((a, c) => a + c.debt_paid, 0);
  const count = (s: ClientStatus) => cl.filter((c) => c.status === s).length;
  const pct = g?.revenueGoal ? Math.round((revenue / g.revenueGoal) * 100) : 0;
  const CIRC = 263.9;

  function patchClient(c: BizClient, patch: Partial<BizClient>) {
    clients.setData(cl.map((x) => (x.id === c.id ? { ...x, ...patch } : x)));
    run(() => updateClient(c.id, patch), "", () => {});
  }

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Helping women get out of debt</span>
          <h2 className="page-title biz-title">Money &amp; Grace Co.</h2>
        </div>
        <MonthNav month={month} current={now} onChange={setMonth} />
      </div>

      {failed && <p className="auth-err">Some business details couldn&apos;t load. Check your internet connection, then refresh. If this is your first time here, run <b>supabase/phase4.sql</b> in Supabase.</p>}

      {g && (
        <div className="bgrid-top">
          <section className="card" aria-labelledby="h-rev">
            <CardHeader id="h-rev" icon="gem" eyebrow={`${MONTHS[month.getMonth()]}${isCurrent ? " so far" : ""}`} title="Revenue" />
            <div className="rev">
              <div className="ring">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--blush)" strokeWidth="9" />
                  <circle className="prog" cx="50" cy="50" r="42" fill="none" stroke="var(--gold)" strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - Math.min(100, pct) / 100)} style={{ "--c": CIRC } as React.CSSProperties} />
                </svg>
                <div className="rv"><b>{pct}%</b><small>of goal</small></div>
              </div>
              <div className="rev-t">
                <b>{usd(revenue)}</b>
                <p>Goal {usd(g.revenueGoal)}{revenue < g.revenueGoal ? ` · ${usd(g.revenueGoal - revenue)} to go` : " · goal reached!"}</p>
              </div>
            </div>
            <RevenueBars months={sixMonths} goal={g.revenueGoal} />
          </section>

          <section className="card" aria-labelledby="h-impact">
            <CardHeader id="h-impact" icon="heart" eyebrow="Your impact" title="Client debt paid off" />
            <div className="impact">
              <div className="lbl"><span>Total across your clients</span><b>{usd(debtPaid)}</b></div>
              <Progress value={debtPaid} max={g.debtGoal} tone="gold" />
              <small>{g.debtGoal ? `${Math.round((debtPaid / g.debtGoal) * 100)}% of your ${usd(g.debtGoal)} goal` : "Set a goal below"}</small>
            </div>
            <div className="minis">
              <div><small>Active clients</small><b>{count("Active")}</b></div>
              <div><small>Calls booked</small><b>{count("Call booked")}</b></div>
              <div><small>Community</small><b>{g.community.toLocaleString("en-US")}</b></div>
            </div>
            {editGoals ? (
              <form className="pform" onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const next = { revenueGoal: parseMoney(f.get("rev")) ?? 0, debtGoal: parseMoney(f.get("debt")) ?? 0, community: Math.round(Number(String(f.get("comm") || "0").replace(/[^\d]/g, ""))) };
                goals.setData(next);
                setEditGoals(false);
                run(() => saveBizGoals(next), "Goals saved.", () => {});
              }}>
                <label>Monthly revenue goal<input id="goal-rev" name="rev" inputMode="decimal" defaultValue={g.revenueGoal} /></label>
                <label>Client debt goal<input id="goal-debt" name="debt" inputMode="decimal" defaultValue={g.debtGoal} /></label>
                <label className="full">Community size <small>(email list or followers)</small><input id="goal-comm" name="comm" inputMode="numeric" defaultValue={g.community} /></label>
                <div className="form-actions full"><button type="button" className="btn ghost" onClick={() => setEditGoals(false)}>Cancel</button><button type="submit" className="btn">Save</button></div>
              </form>
            ) : (
              <div className="card-foot"><button type="button" className="btn ghost sm" onClick={() => setEditGoals(true)}>Edit goals & community</button></div>
            )}
          </section>
        </div>
      )}

      <div className="split">
        {/* Clients pipeline */}
        <section className="card" aria-labelledby="h-clients">
          <CardHeader id="h-clients" icon="star" eyebrow="Pipeline" title="Clients" meta={<><b>{cl.length}</b>total</>} />
          {clients.data && cl.length === 0 && !addingClient && <p className="empty">Add leads and clients here. Move them from Lead to Call booked to Active as they go.</p>}
          {addingClient ? (
            <form className="pform" onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run(() => addClient({ name: String(f.get("name")).trim(), status: String(f.get("status")) as ClientStatus, offer: String(f.get("offer") || "") || null, debt_paid: 0, notes: String(f.get("notes") || "").trim() || null }),
                "Client added.", () => { setAddingClient(false); clients.reload(); });
            }}>
              <label className="full">Name<input id="client-name" name="name" placeholder="First name and last initial" maxLength={60} required autoFocus /></label>
              <label>Status<select id="client-status" name="status">{CLIENT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
              <label>Offer<select id="client-offer" name="offer">{OFFERS.map((o) => <option key={o}>{o}</option>)}</select></label>
              <label className="full">Notes <small>(optional)</small><input id="client-notes" name="notes" placeholder="Found me on Instagram" maxLength={200} /></label>
              <div className="form-actions full"><button type="button" className="btn ghost" onClick={() => setAddingClient(false)}>Cancel</button><button type="submit" className="btn">Add client</button></div>
            </form>
          ) : (
            <div className="card-foot"><button type="button" className="btn ghost sm" onClick={() => setAddingClient(true)}>Add a client or lead</button></div>
          )}
          <div className="pipeline">
            {CLIENT_STATUSES.map((s) => {
              const inStage = cl.filter((c) => c.status === s);
              return (
                <div className="stage" key={s}>
                  <h3>{s} <span>{inStage.length}</span></h3>
                  {inStage.map((c) => (
                    <div className="client" key={c.id}>
                      <div className="client-top">
                        <b>{c.name}</b>
                        <DeleteButton label={`Delete ${c.name}`} onConfirm={() => run(() => deleteClient(c.id), "Client removed.", clients.reload)} />
                      </div>
                      {(c.offer || c.notes) && <span className="muted">{[c.offer, c.notes].filter(Boolean).join(" · ")}</span>}
                      <div className="client-ctrls">
                        <label className="sr-only" htmlFor={`st-${c.id}`}>Status for {c.name}</label>
                        <select id={`st-${c.id}`} value={c.status} onChange={(e) => patchClient(c, { status: e.currentTarget.value as ClientStatus })}>
                          {CLIENT_STATUSES.map((x) => <option key={x}>{x}</option>)}
                        </select>
                        <label className="debt-in">
                          <span>Debt paid off</span>
                          <input id={`dp-${c.id}`} inputMode="decimal" defaultValue={c.debt_paid ? usd(c.debt_paid) : ""} key={c.debt_paid} placeholder="$0"
                            onBlur={(e) => {
                              const v = e.currentTarget.value.trim() === "" ? 0 : parseMoney(e.currentTarget.value);
                              if (v !== null && v !== c.debt_paid) {
                                if (v > c.debt_paid) heartBurst(e.currentTarget);
                                patchClient(c, { debt_paid: v });
                              }
                            }}
                            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </section>

        <div className="stack">
          {/* Income log */}
          <section className="card" aria-labelledby="h-income">
            <CardHeader id="h-income" icon="coin" eyebrow={MONTHS[month.getMonth()]} title="Income" meta={<><b>{thisMonth.length}</b>{thisMonth.length === 1 ? "payment" : "payments"}</>} />
            <form className="pform" onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const f = new FormData(form);
              const amount = parseMoney(f.get("amount"));
              if (!amount) return toast("Enter an amount, like 497.");
              run(() => addBizIncome({ day: String(f.get("day")), amount, offer: String(f.get("offer")), client: String(f.get("client") || "").trim() || null }),
                "Income added. Cha-ching!", () => { form.reset(); income.reload(); });
            }}>
              <label>Amount<input id="inc-amount" name="amount" inputMode="decimal" placeholder="$497" required /></label>
              <label>Date<input id="inc-day" name="day" type="date" defaultValue={isCurrent ? isoDate(now) : isoDate(month)} key={mk} required /></label>
              <label>Offer<select id="inc-offer" name="offer">{OFFERS.map((o) => <option key={o}>{o}</option>)}</select></label>
              <label>Client <small>(optional)</small><input id="inc-client" name="client" maxLength={60} /></label>
              <div className="form-actions full"><button type="submit" className="btn">Add income</button></div>
            </form>
            <ul className="txn-list">
              {thisMonth.map((r) => (
                <li key={r.id}>
                  <div className="todo-main">
                    <span className="todo-title">{r.client || r.offer}</span>
                    <span className="todo-meta"><span className="tag-pill">{r.offer}</span><span>{shortDate(r.day)}</span></span>
                  </div>
                  <b className="amt income">+{usd(r.amount, true)}</b>
                  <DeleteButton label={`Delete ${usd(r.amount, true)} payment`} onConfirm={() => run(() => deleteBizIncome(r.id), "Deleted.", income.reload)} />
                </li>
              ))}
            </ul>
          </section>

          {/* Launches */}
          <section className="card" aria-labelledby="h-launch">
            <CardHeader id="h-launch" icon="sparkle" eyebrow="Coming soon" title="Launches" />
            {launches.data?.length === 0 && <p className="empty">Add your next workshop, course or offer launch.</p>}
            <ul className="txn-list">
              {(launches.data ?? []).map((l) => (
                <li key={l.id} className={l.done ? "done" : ""}>
                  <button type="button" className={`chk${l.done ? " on" : ""}`} aria-pressed={l.done} aria-label={`Mark ${l.name} ${l.done ? "not launched" : "launched"}`}
                    onClick={(e) => {
                      launches.setData((launches.data ?? []).map((x) => (x.id === l.id ? { ...x, done: !l.done } : x)));
                      if (!l.done) heartBurst(e.currentTarget);
                      run(() => setLaunchDone(l.id, !l.done), l.done ? "" : "Launched! Congratulations.", () => {});
                    }}>
                    <Icon name="check" strokeWidth={2.4} />
                  </button>
                  <div className="todo-main">
                    <span className="todo-title">{l.name}</span>
                    <span className="todo-meta"><span>{shortDate(l.day)}</span></span>
                  </div>
                  <DeleteButton label={`Delete ${l.name}`} onConfirm={() => run(() => deleteLaunch(l.id), "Launch removed.", launches.reload)} />
                </li>
              ))}
            </ul>
            <form className="ms-add" onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const f = new FormData(form);
              const name = String(f.get("name")).trim();
              if (!name) return;
              run(() => addLaunch({ name, day: String(f.get("day")) }), "Launch added.", () => { form.reset(); launches.reload(); });
            }}>
              <label htmlFor="launch-name" className="sr-only">Launch name</label>
              <input id="launch-name" name="name" placeholder="Debt-Free by Spring workshop" maxLength={80} required />
              <label htmlFor="launch-day" className="sr-only">Launch date</label>
              <input id="launch-day" name="day" type="date" className="date-sm" required />
              <button type="submit" className="iconbtn" aria-label="Add launch"><Icon name="plus" /></button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
