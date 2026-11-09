"use client";

import { useEffect, useState } from "react";
import { CardHeader } from "../home/CardHeader";
import { listDays, type DayRow } from "@/lib/data";
import { MOODS } from "@/lib/sample-data";
import { MONTHS, WEEKDAYS, addDays, isoDate } from "@/lib/dates";

const DAYS = 14;
const W = 420;
const H = 132;
const PAD = { l: 34, r: 8, t: 10, b: 22 };

type Point = { day: Date; value: number | null };

const longDate = (d: Date) => `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;

/** Single-series bar chart: one hue, thin bars with rounded tops, recessive grid, goal line, native hover titles. */
function Bars({ points, max, ticks, goal, color, format, label }: {
  points: Point[]; max: number; ticks: number[]; goal?: number; color: string; format: (v: number) => string; label: string;
}) {
  const cw = (W - PAD.l - PAD.r) / points.length;
  const bw = Math.min(16, cw - 6);
  const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="trend-svg" role="img" aria-label={label}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
          <text x={PAD.l - 6} y={y(t) + 3} textAnchor="end" fontSize="9" fill="var(--muted)">{format(t)}</text>
        </g>
      ))}
      {goal !== undefined && <line x1={PAD.l} x2={W - PAD.r} y1={y(goal)} y2={y(goal)} stroke="var(--gold)" strokeDasharray="3 4" strokeWidth="1.2" />}
      {points.map((p, i) => {
        const cx = PAD.l + cw * i + cw / 2;
        const v = p.value;
        const h = v ? Math.max(2, y(0) - y(Math.min(v, max))) : 0;
        return (
          <g key={i}>
            <rect x={cx - cw / 2} y={PAD.t} width={cw} height={H - PAD.t - PAD.b} fill="transparent">
              <title>{`${longDate(p.day)}: ${v === null ? "not logged" : format(v)}`}</title>
            </rect>
            {v !== null && v > 0 && (
              <path pointerEvents="none" fill={color}
                d={`M${cx - bw / 2} ${y(0)} V${y(0) - h + 4} Q${cx - bw / 2} ${y(0) - h} ${cx - bw / 2 + 4} ${y(0) - h} H${cx + bw / 2 - 4} Q${cx + bw / 2} ${y(0) - h} ${cx + bw / 2} ${y(0) - h + 4} V${y(0)} Z`} />
            )}
            {(i % 2 === points.length % 2 || i === points.length - 1) && (
              <text x={cx} y={H - 6} textAnchor="middle" fontSize="9" fill={i === points.length - 1 ? "var(--ink)" : "var(--muted)"}>{p.day.getDate()}</text>
            )}
          </g>
        );
      })}
      <line x1={PAD.l} x2={W - PAD.r} y1={y(0)} y2={y(0)} stroke="var(--muted)" strokeWidth="1" opacity=".5" />
    </svg>
  );
}

/** Mood dots: one per day on a five-step scale, joined by a thin line where days are consecutive. */
function MoodDots({ points }: { points: { day: Date; mood: string | null }[] }) {
  const levels = [...MOODS].reverse(); // Low … Radiant, bottom to top
  const cw = (W - 64 - PAD.r) / points.length;
  const y = (m: string) => PAD.t + ((levels.length - 1 - levels.indexOf(m as (typeof levels)[number])) / (levels.length - 1)) * (H - PAD.t - PAD.b);
  const xs = points.map((_, i) => 64 + cw * i + cw / 2);
  let path = "";
  points.forEach((p, i) => {
    if (!p.mood) return;
    path += `${i > 0 && points[i - 1].mood ? "L" : "M"}${xs[i]} ${y(p.mood)} `;
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="trend-svg" role="img" aria-label="Mood for the last 14 days">
      {levels.map((m) => (
        <g key={m}>
          <line x1={64} x2={W - PAD.r} y1={y(m)} y2={y(m)} stroke="var(--line)" />
          <text x={58} y={y(m) + 3} textAnchor="end" fontSize="9" fill="var(--muted)">{m}</text>
        </g>
      ))}
      <path d={path} fill="none" stroke="var(--rose)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          {p.mood && <circle cx={xs[i]} cy={y(p.mood)} r="5" fill="var(--hot)" stroke="var(--card)" strokeWidth="2" />}
          <rect x={xs[i] - cw / 2} y={PAD.t - 6} width={cw} height={H - PAD.b} fill="transparent">
            <title>{`${longDate(p.day)}: ${p.mood ?? "not logged"}`}</title>
          </rect>
          {(i % 2 === points.length % 2 || i === points.length - 1) && (
            <text x={xs[i]} y={H - 6} textAnchor="middle" fontSize="9" fill={i === points.length - 1 ? "var(--ink)" : "var(--muted)"}>{p.day.getDate()}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

type Props = { now: Date; todayWater: number; todayMood: string; todaySleep: number | null };

export function Trends({ now, todayWater, todayMood, todaySleep }: Props) {
  const days = Array.from({ length: DAYS }, (_, i) => addDays(now, i - (DAYS - 1)));
  const from = isoDate(days[0]);
  const to = isoDate(days[DAYS - 1]);
  const [rows, setRows] = useState<DayRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<"sleep" | "water" | "mood">("sleep");

  useEffect(() => {
    let live = true;
    listDays(from, to)
      .then((r) => live && setRows(r))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [from, to]);

  const byDay = new Map((rows ?? []).map((r) => [r.day, r]));
  const get = (d: Date) => (isoDate(d) === to ? { water: todayWater, mood: todayMood || null, sleep_minutes: todaySleep } : byDay.get(isoDate(d)));

  const sleep = days.map((d) => ({ day: d, value: get(d)?.sleep_minutes != null ? get(d)!.sleep_minutes! / 60 : null }));
  const water = days.map((d) => ({ day: d, value: get(d)?.water ?? null }));
  const mood = days.map((d) => ({ day: d, mood: get(d)?.mood ?? null }));
  const logged = sleep.filter((p) => p.value !== null);
  const avgSleep = logged.length ? logged.reduce((a, p) => a + p.value!, 0) / logged.length : null;
  const hrs = (v: number) => `${Math.floor(v)}h${Math.round((v % 1) * 60) ? ` ${Math.round((v % 1) * 60)}m` : ""}`;

  return (
    <section className="card" style={{ gridArea: "trends" }} aria-labelledby="h-trends">
      <CardHeader id="h-trends" icon="star" eyebrow="Last 14 days" title="Trends"
        meta={tab === "sleep" && avgSleep !== null ? <><b>{hrs(avgSleep)}</b>average sleep</> : undefined} />
      <div className="seg" role="tablist" aria-label="Trend">
        {(["sleep", "water", "mood"] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
            {t === "sleep" ? "Sleep" : t === "water" ? "Water" : "Mood"}
          </button>
        ))}
      </div>
      {failed && <p className="auth-err">Your trends couldn&apos;t load. Check your internet connection, then refresh.</p>}
      {rows !== null && tab === "sleep" && <Bars points={sleep} max={10} ticks={[0, 4, 8]} goal={8} color="var(--leaf-deep)" format={hrs} label="Hours of sleep each night for the last 14 days, with an 8 hour goal line" />}
      {rows !== null && tab === "water" && <Bars points={water} max={8} ticks={[0, 4, 8]} color="var(--rose)" format={(v) => `${v} glasses`} label="Glasses of water each day for the last 14 days" />}
      {rows !== null && tab === "mood" && <MoodDots points={mood} />}
      <p className="hint-sm">
        {tab === "sleep" ? "Dashed gold line: your 8-hour goal. Hover or press a day for details." : tab === "water" ? "8 glasses is a full day." : "One dot per day you logged a mood."}
      </p>
    </section>
  );
}
