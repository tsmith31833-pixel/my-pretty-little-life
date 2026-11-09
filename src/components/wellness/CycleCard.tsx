"use client";

import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { CardHeader } from "../home/CardHeader";
import { useShell } from "../shell/AppShell";
import { deletePeriod, endPeriod, listPeriods, startPeriod, type Period } from "@/lib/data";
import { MONTHS, addDays, isoDate } from "@/lib/dates";

const day = (s: string) => new Date(`${s}T12:00:00`);
const between = (a: string, b: string) => Math.round((day(b).getTime() - day(a).getTime()) / 864e5);
const nice = (s: string) => `${MONTHS[day(s).getMonth()].slice(0, 3)} ${day(s).getDate()}`;
const avg = (xs: number[], fallback: number) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : fallback);

export function CycleCard({ now }: { now: Date }) {
  const { toast } = useShell();
  const today = isoDate(now);
  const [periods, setPeriods] = useState<Period[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    listPeriods()
      .then((r) => live && (setPeriods(r), setFailed(false)))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [reload]);

  async function act(fn: () => Promise<void>, ok: string) {
    try {
      await fn();
      toast(ok);
    } catch {
      toast("That didn't save. Check your internet connection and try again.");
    }
    setReload((r) => r + 1);
  }

  const list = periods ?? [];
  // Cycle length = days between one period start and the next (last 6, ignoring unusual gaps).
  const cycleLengths = list.slice(0, 7).map((p, i) => (list[i + 1] ? between(list[i + 1].start_day, p.start_day) : 0)).filter((n) => n >= 15 && n <= 60);
  const cycleLen = avg(cycleLengths, 28);
  const periodLen = avg(list.filter((p) => p.end_day).slice(0, 6).map((p) => between(p.start_day, p.end_day!) + 1), 5);
  const last = list[0];
  const open = last && !last.end_day ? last : null;
  const cycleDay = last ? between(last.start_day, today) + 1 : null;
  const nextStart = last ? isoDate(addDays(day(last.start_day), cycleLen)) : null;
  const daysToNext = nextStart ? between(today, nextStart) : null;

  return (
    <section className="card" style={{ gridArea: "cycle" }} aria-labelledby="h-cycle">
      <CardHeader id="h-cycle" icon="moon" eyebrow="Your rhythm" title="Cycle" />
      {failed && <p className="auth-err">Your cycle couldn&apos;t load. Check your internet connection, then refresh. If this is your first time here, run <b>supabase/phase3.sql</b> in Supabase.</p>}

      {periods !== null && (
        <>
          <div className="cycle-hero">
            {!last && <p className="empty">Log the first day of your next period and your cycle day and next-period estimate appear here.</p>}
            {open && <><b>Period day {cycleDay}</b><span>Typical length {periodLen} days</span></>}
            {last && !open && (
              <>
                <b>Cycle day {cycleDay}</b>
                <span>
                  {daysToNext! > 1 && `Next period in about ${daysToNext} days (around ${nice(nextStart!)})`}
                  {daysToNext === 1 && "Next period expected tomorrow"}
                  {daysToNext === 0 && "Next period expected today"}
                  {daysToNext! < 0 && `Next period expected ${-daysToNext!} ${daysToNext === -1 ? "day" : "days"} ago (${nice(nextStart!)})`}
                </span>
              </>
            )}
            {last && <small>Average cycle {cycleLen} days{cycleLengths.length < 2 ? " (estimate improves as you log more)" : ""}</small>}
          </div>

          <div className="cycle-actions">
            {open ? (
              <>
                <button type="button" className="btn" onClick={() => act(() => endPeriod(open.id, today), "Period end saved.")}>Period ended today</button>
                <form className="inline-date" onSubmit={(e) => {
                  e.preventDefault();
                  const v = String(new FormData(e.currentTarget).get("endDay"));
                  if (v && v >= open.start_day) act(() => endPeriod(open.id, v), "Period end saved.");
                }}>
                  <label htmlFor="endDay">Or it ended on</label>
                  <input id="endDay" name="endDay" type="date" min={open.start_day} max={today} required />
                  <button type="submit" className="btn ghost sm">Save</button>
                </form>
              </>
            ) : (
              <>
                <button type="button" className="btn" onClick={() => act(() => startPeriod(today), "Period start saved.")}>Period started today</button>
                <form className="inline-date" onSubmit={(e) => {
                  e.preventDefault();
                  const v = String(new FormData(e.currentTarget).get("startDay"));
                  if (v) act(() => startPeriod(v), "Period start saved.");
                }}>
                  <label htmlFor="startDay">Or it started on</label>
                  <input id="startDay" name="startDay" type="date" max={today} required />
                  <button type="submit" className="btn ghost sm">Save</button>
                </form>
              </>
            )}
          </div>

          {list.length > 0 && (
            <ul className="period-list">
              {list.slice(0, 6).map((p, i) => (
                <li key={p.id}>
                  <span>{nice(p.start_day)}{p.end_day ? ` – ${nice(p.end_day)}` : " – ongoing"}</span>
                  <span className="muted">
                    {p.end_day ? `${between(p.start_day, p.end_day) + 1}-day period` : ""}
                    {list[i + 1] ? `${p.end_day ? " · " : ""}${between(list[i + 1].start_day, p.start_day)}-day cycle` : ""}
                  </span>
                  <button type="button" className={`iconbtn del${confirmId === p.id ? " confirm" : ""}`} aria-label={`Delete period starting ${nice(p.start_day)}`}
                    onBlur={() => setConfirmId(null)}
                    onClick={() => {
                      if (confirmId !== p.id) return setConfirmId(p.id);
                      setConfirmId(null);
                      act(() => deletePeriod(p.id), "Deleted.");
                    }}>
                    {confirmId === p.id ? "Delete?" : <Icon name="x" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="hint-sm">Estimates come from your own history. They aren&apos;t medical advice and aren&apos;t reliable for birth control.</p>
        </>
      )}
    </section>
  );
}
