"use client";

import Link from "next/link";
import { Icon } from "../Icon";
import { CardHeader } from "./CardHeader";
import { Progress } from "../ui";
import { getBizGoals, listBizIncome, listClients, listLaunches, monthKey, usd, useRows } from "@/lib/money";
import { MONTHS, WEEKDAYS, isoDate } from "@/lib/dates";

const CIRC = 263.9; // ring circumference for r = 42

function RevenueTrend({ months, goal }: { months: { label: string; total: number }[]; goal: number }) {
  const vals = months.map((m) => m.total);
  const W = 300, H = 96, pl = 8, pr = 34, pt = 12, pb = 20;
  const max = Math.max(goal, ...vals, 1) * 1.07;
  const X = (i: number) => pl + (i * (W - pl - pr)) / (vals.length - 1);
  const Y = (v: number) => pt + (1 - v / max) * (H - pt - pb);
  const line = vals.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
  const lastI = vals.length - 1;
  const area = `${line} L${X(lastI).toFixed(1)} ${H - pb} L${X(0)} ${H - pb}Z`;
  const k = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`);
  return (
    <div className="spark-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Revenue over the last six months: ${months.map((m) => `${m.label} ${usd(m.total)}`).join(", ")}`}>
        <defs>
          <linearGradient id="sg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--rose)", stopOpacity: 0.45 }} />
            <stop offset="1" style={{ stopColor: "var(--rose)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        {goal > 0 && (
          <>
            <line x1={pl} x2={W - pr} y1={Y(goal)} y2={Y(goal)} stroke="var(--gold)" strokeDasharray="3 4" />
            <text x={W - pr + 4} y={Y(goal) + 3} fontSize="9" fill="var(--gold-text)">Goal</text>
          </>
        )}
        <line x1={pl} x2={W - pr} y1={H - pb} y2={H - pb} stroke="var(--line)" />
        <path d={area} fill="url(#sg)" />
        <path d={line} fill="none" stroke="var(--hot)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        {months.map((m, i) => (
          <text key={i} x={X(i)} y={H - 6} fontSize="9" textAnchor="middle" fill="var(--muted)">{m.label}</text>
        ))}
        <circle cx={X(lastI)} cy={Y(vals[lastI])} r="4.5" fill="var(--hot)" stroke="var(--card)" strokeWidth="2" />
        <text x={X(lastI) + 8} y={Y(vals[lastI]) + 4} fontSize="9.5" fill="var(--ink)">{k(vals[lastI])}</text>
      </svg>
    </div>
  );
}

export function BusinessSnapshot({ now }: { now: Date }) {
  const mk = monthKey(now);
  const sixStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const income = useRows(() => listBizIncome(isoDate(sixStart), isoDate(now)), [mk]);
  const clients = useRows(listClients, []);
  const launches = useRows(listLaunches, []);
  const goals = useRows(getBizGoals, []);

  const failed = income.failed || clients.failed || launches.failed || goals.failed;
  const ready = income.data && clients.data && launches.data && goals.data;
  const g = goals.data;
  const rows = income.data ?? [];
  const revenue = rows.filter((r) => r.day.startsWith(mk)).reduce((a, r) => a + r.amount, 0);
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(sixStart.getFullYear(), sixStart.getMonth() + i, 1);
    const key = monthKey(d);
    return { label: MONTHS[d.getMonth()].slice(0, 3), total: rows.filter((r) => r.day.startsWith(key)).reduce((a, r) => a + r.amount, 0) };
  });
  const cl = clients.data ?? [];
  const debtPaid = cl.reduce((a, c) => a + c.debt_paid, 0);
  const today = isoDate(now);
  const next = (launches.data ?? []).find((l) => !l.done && l.day >= today);
  const nextDate = next ? new Date(`${next.day}T12:00:00`) : null;
  const pct = g?.revenueGoal ? Math.round((revenue / g.revenueGoal) * 100) : 0;
  const empty = ready && rows.length === 0 && cl.length === 0 && (launches.data ?? []).length === 0;

  return (
    <section className="card" style={{ gridArea: "biz" }} aria-labelledby="h-biz">
      <CardHeader id="h-biz" icon="gem" eyebrow="Your business" title="Business snapshot" />
      <div className="biz-mark">Money &amp; Grace Co.</div>
      {failed && <p className="empty">Business details couldn&apos;t load. <Link href="/business">Open Money &amp; Grace Co.</Link> to check.</p>}
      {empty && <p className="empty">Log income, clients and launches in <Link href="/business">Money &amp; Grace Co.</Link> and your snapshot fills in here.</p>}
      {ready && g && !empty && (
        <>
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
              <span className="eyebrow">Revenue, month to date</span>
              <b>{usd(revenue)}</b>
              <p>Goal {usd(g.revenueGoal)}{revenue < g.revenueGoal ? ` · ${usd(g.revenueGoal - revenue)} to go` : " · reached!"}</p>
            </div>
          </div>
          <div className="impact">
            <div className="lbl"><span>Client debt paid off</span><b>{usd(debtPaid)}</b></div>
            <Progress value={debtPaid} max={g.debtGoal} tone="gold" />
            {g.debtGoal > 0 && <small>{Math.round((debtPaid / g.debtGoal) * 100)}% of the {usd(g.debtGoal)} goal</small>}
          </div>
          <RevenueTrend months={months} goal={g.revenueGoal} />
          <div className="minis">
            <div><small>Active clients</small><b>{cl.filter((c) => c.status === "Active").length}</b></div>
            <div><small>Calls booked</small><b>{cl.filter((c) => c.status === "Call booked").length}</b></div>
            <div><small>Community</small><b>{g.community.toLocaleString("en-US")}</b></div>
          </div>
          {next && nextDate && (
            <div className="launch">
              <Icon name="sparkle" />
              <div><b>{next.name}</b><span>Launches {WEEKDAYS[nextDate.getDay()]}, {MONTHS[nextDate.getMonth()].slice(0, 3)} {nextDate.getDate()}</span></div>
            </div>
          )}
        </>
      )}
      <Link className="see-all" href="/business">Open Money &amp; Grace Co.</Link>
    </section>
  );
}
