"use client";

import { useEffect, useState } from "react";
import { CardHeader } from "../home/CardHeader";
import { listWeeks, type HabitDef, type WeekRow } from "@/lib/data";
import { MONTHS, addDays, isoDate } from "@/lib/dates";

const WEEKS = 8;

/** Sequential pink: more days done in a week → deeper pink. */
const SHADES = ["var(--cream)", "var(--blush)", "var(--baby)", "var(--rose)", "var(--hot)"];
const shade = (days: number) => SHADES[days === 0 ? 0 : days <= 2 ? 1 : days <= 4 ? 2 : days <= 6 ? 3 : 4];

export function HabitHistory({ now, habits }: { now: Date; habits: HabitDef[] }) {
  const thisWeek = addDays(now, -now.getDay());
  const starts = Array.from({ length: WEEKS }, (_, i) => addDays(thisWeek, -7 * (WEEKS - 1 - i)));
  const from = isoDate(starts[0]);
  const to = isoDate(thisWeek);
  const [rows, setRows] = useState<WeekRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    listWeeks(from, to)
      .then((r) => live && setRows(r))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [from, to]);

  const byWeek = new Map((rows ?? []).map((r) => [r.week_start, r.checks]));
  const label = (d: Date) => `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;

  return (
    <section className="card" style={{ gridArea: "history" }} aria-labelledby="h-hist">
      <CardHeader id="h-hist" icon="calendar" eyebrow="Last 8 weeks" title="Habit history" />
      {failed && <p className="auth-err">Your habit history couldn&apos;t load. Check your internet connection, then refresh.</p>}
      <div className="heat-scroll">
        <table className="heat">
          <caption className="sr-only">Days each habit was done per week, last 8 weeks</caption>
          <thead>
            <tr>
              <th scope="col"><span className="sr-only">Habit</span></th>
              {starts.map((s) => (
                <th scope="col" key={isoDate(s)}>
                  <span className="wk-m">{MONTHS[s.getMonth()].slice(0, 3)}</span>
                  <span className="wk-d">{s.getDate()}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habits.map((h) => (
              <tr key={h.id}>
                <th scope="row">{h.name}</th>
                {starts.map((s, wi) => {
                  const key = isoDate(s);
                  const daysInWeek = wi === WEEKS - 1 ? now.getDay() + 1 : 7;
                  const n = (byWeek.get(key)?.[h.id] ?? []).slice(0, daysInWeek).filter(Boolean).length;
                  return (
                    <td key={key}>
                      <span className="heat-cell" style={{ background: shade(n) }} title={`${h.name}, week of ${label(s)}: ${n} of ${daysInWeek} days`}>
                        <span className="sr-only">{n} of {daysInWeek} days</span>
                        {n > 0 && <b aria-hidden="true">{n}</b>}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="heat-legend" aria-hidden="true">
        <span>Days done per week</span>
        {["0", "1–2", "3–4", "5–6", "7"].map((t, i) => (
          <span key={t} className="lg"><i style={{ background: SHADES[i] }} />{t}</span>
        ))}
      </div>
    </section>
  );
}
