"use client";

import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { Bow, Butterfly } from "../Ornaments";
import { AppShell } from "../shell/AppShell";
import { CardHeader } from "../home/CardHeader";
import { Progress } from "../ui";
import { loadYear, type YearData } from "@/lib/year";
import { photoUrls } from "@/lib/data";
import { useSettings } from "@/lib/settings";
import { MOODS } from "@/lib/sample-data";
import { usd, useRows } from "@/lib/money";
import { MONTHS, addDays, isoDate } from "@/lib/dates";

export function YearScreen({ now }: { now: Date }) {
  return (
    <AppShell title="Pretty Little Year" crumb="Your year in review">
      <YearBody now={now} />
    </AppShell>
  );
}

const fromIso = (s: string) => new Date(`${s}T12:00:00`);
const nice = (s: string) => `${MONTHS[fromIso(s).getMonth()].slice(0, 3)} ${fromIso(s).getDate()}`;
const num = (n: number) => n.toLocaleString("en-US");

/** Spread picks evenly through a list (so highlights come from across the year, not one week). */
function spread<T>(list: T[], count: number) {
  if (list.length <= count) return list;
  return Array.from({ length: count }, (_, i) => list[Math.floor((i * (list.length - 1)) / (count - 1))]);
}

function YearBody({ now }: { now: Date }) {
  const [year, setYear] = useState(now.getFullYear());
  const data = useRows(() => loadYear(year), [year]);
  const { habits } = useSettings(() => {});
  const d = data.data;

  return (
    <>
      <section className="year-hero" aria-label={`My Pretty Little Year ${year}`}>
        <Bow className="yh-bow" />
        <Butterfly style={{ right: "12%", top: "18%" }} />
        <span className="eyebrow">Your year in review</span>
        <h2 className="yh-title">My Pretty Little Year</h2>
        <div className="yh-year">
          <button type="button" className="iconbtn round" aria-label="Previous year" onClick={() => setYear(year - 1)}>‹</button>
          <b>{year}</b>
          <button type="button" className="iconbtn round" aria-label="Next year" disabled={year >= now.getFullYear()} onClick={() => setYear(year + 1)}>›</button>
        </div>
        {d && <p className="yh-sub">{yearLine(d, year, now)}</p>}
      </section>

      {data.failed && <p className="auth-err">Your year couldn&apos;t load. Check your internet connection, then refresh.</p>}
      {!d && !data.failed && <p className="empty">Gathering your year…</p>}
      {d && <YearContent d={d} year={year} now={now} habitNames={new Map(habits.map((h) => [h.id, h.name]))} />}
    </>
  );
}

function daysLogged(d: YearData) {
  return d.days.filter((x) => x.water > 0 || x.mood || x.wins.length || x.priorities.some((p) => p.text) || x.sleep_minutes !== null).length;
}

function yearLine(d: YearData, year: number, now: Date) {
  const logged = daysLogged(d);
  if (!logged && !d.journal.length) return year === now.getFullYear() ? "Your year is just getting started. Every day you log fills this page." : "Nothing was logged this year.";
  return `You showed up for yourself on ${num(logged)} ${logged === 1 ? "day" : "days"}. Look at everything you did.`;
}

function YearContent({ d, year, now, habitNames }: { d: YearData; year: number; now: Date; habitNames: Map<string, string> }) {
  const lastDay = year === now.getFullYear() ? isoDate(now) : `${year}-12-31`;

  // ---- habits: total check-ins and longest streak per habit, within the year ----
  const doneDays = new Map<string, Set<string>>();
  for (const w of d.weeks) {
    const start = fromIso(w.week_start);
    for (const [id, row] of Object.entries(w.checks ?? {})) {
      row.forEach((on, i) => {
        if (!on) return;
        const day = isoDate(addDays(start, i));
        if (day.startsWith(String(year)) && day <= lastDay) {
          if (!doneDays.has(id)) doneDays.set(id, new Set());
          doneDays.get(id)!.add(day);
        }
      });
    }
  }
  const habitStats = [...doneDays.entries()].map(([id, set]) => {
    const sorted = [...set].sort();
    let best = 0, run = 0, prev = "";
    for (const day of sorted) {
      run = prev && isoDate(addDays(fromIso(prev), 1)) === day ? run + 1 : 1;
      best = Math.max(best, run);
      prev = day;
    }
    return { id, name: habitNames.get(id) ?? "An earlier habit", total: set.size, streak: best };
  }).sort((a, b) => b.total - a.total);
  const checkIns = habitStats.reduce((a, h) => a + h.total, 0);
  const topHabit = habitStats[0];
  const longest = [...habitStats].sort((a, b) => b.streak - a.streak)[0];

  // ---- wins, journal, gratitude ----
  const wins = d.days.flatMap((x) => x.wins.filter(Boolean).map((w) => ({ day: x.day, text: w })));
  const words = d.journal.reduce((a, j) => a + (j.body.trim() ? j.body.trim().split(/\s+/).length : 0), 0);
  const entries = d.journal.filter((j) => j.body.trim()).length;
  const gratitude = d.journal.flatMap((j) => j.gratitude.filter((g) => g?.trim()).map((g) => ({ day: j.day, text: g })));
  const photos = d.journal.flatMap((j) => j.photos.map((p) => ({ day: j.day, path: p })));
  const favorites = [...d.journal].filter((j) => j.body.trim()).sort((a, b) => b.body.length - a.body.length).slice(0, 3).sort((a, b) => a.day.localeCompare(b.day));
  const prioritiesDone = d.days.reduce((a, x) => a + x.priorities.filter((p) => p.done && p.text).length, 0);

  // ---- wellness ----
  const sleeps = d.days.filter((x) => x.sleep_minutes !== null).map((x) => x.sleep_minutes!);
  const avgSleep = sleeps.length ? sleeps.reduce((a, b) => a + b, 0) / sleeps.length : null;
  const water = d.days.reduce((a, x) => a + (x.water ?? 0), 0);
  const steps = d.days.reduce((a, x) => a + (x.steps ?? 0), 0);
  const moods = MOODS.map((m) => ({ mood: m, n: d.days.filter((x) => x.mood === m).length }));
  const moodDays = moods.reduce((a, m) => a + m.n, 0);
  const topMood = [...moods].sort((a, b) => b.n - a.n)[0];

  // ---- business ----
  const revenue = d.bizIncome.reduce((a, b) => a + b.amount, 0);
  const byMonth = Array.from({ length: 12 }, (_, m) => d.bizIncome.filter((b) => Number(b.day.slice(5, 7)) === m + 1).reduce((a, b) => a + b.amount, 0));
  const bestMonth = byMonth.indexOf(Math.max(...byMonth));
  const goalsDone = d.goals.filter((g) => g.milestones?.length && g.milestones.every((m) => m.done)).length;

  const tiles: [string, string][] = [
    [num(daysLogged(d)), "days logged"],
    [num(checkIns), "habit check-ins"],
    [num(wins.length), "wins celebrated"],
    [num(d.todosDone + prioritiesDone), "to-dos & priorities done"],
    [num(entries), "journal pages"],
    [num(words), "words written"],
    [num(d.posted), "posts published"],
    [usd(d.clientDebtPaid), "client debt paid off"],
  ];

  return (
    <>
      <div className="year-tiles">
        {tiles.map(([n, label]) => (
          <div className="year-tile" key={label}><b>{n}</b><span>{label}</span></div>
        ))}
      </div>

      <div className="year-grid">
        <section className="card" aria-labelledby="h-y-habits">
          <CardHeader id="h-y-habits" icon="sparkle" eyebrow="Glow-up" title="Your habits" />
          {habitStats.length === 0 ? <p className="empty">Tick habits on your Today or Wellness page and they&apos;ll add up here.</p> : (
            <>
              <p className="year-callout">
                Your most loyal habit was <b>{topHabit.name}</b>, done on {num(topHabit.total)} days.
                {longest && longest.streak > 1 && <> Your longest streak: <b>{longest.streak} days</b> of {longest.name}.</>}
              </p>
              <div className="rows">
                {habitStats.slice(0, 8).map((h) => (
                  <div className="row" key={h.id}>
                    <div className="lbl"><span>{h.name}</span><span>{num(h.total)} days · best streak {h.streak}</span></div>
                    <Progress value={h.total} max={topHabit.total} />
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="card" aria-labelledby="h-y-well">
          <CardHeader id="h-y-well" icon="drop" eyebrow="Body & soul" title="Wellness" />
          <div className="minis">
            <div><small>Average sleep</small><b>{avgSleep === null ? "–" : `${Math.floor(avgSleep / 60)}h ${Math.round(avgSleep % 60)}m`}</b></div>
            <div><small>Glasses of water</small><b>{num(water)}</b></div>
            <div><small>Steps logged</small><b>{steps >= 1000000 ? `${(steps / 1000000).toFixed(1)}M` : steps >= 10000 ? `${Math.round(steps / 1000)}k` : num(steps)}</b></div>
          </div>
          {moodDays > 0 ? (
            <>
              <p className="year-callout">You felt <b>{topMood.mood.toLowerCase()}</b> most often this year.</p>
              <div className="rows">
                {moods.map((m) => (
                  <div className="row" key={m.mood}>
                    <div className="lbl"><span>{m.mood}</span><span>{Math.round((m.n / moodDays) * 100)}% · {m.n} {m.n === 1 ? "day" : "days"}</span></div>
                    <Progress value={m.n} max={moodDays} />
                  </div>
                ))}
              </div>
            </>
          ) : <p className="empty">Log your mood each day to see your year&apos;s feelings here.</p>}
        </section>

        <section className="card" aria-labelledby="h-y-money">
          <CardHeader id="h-y-money" icon="coin" eyebrow="Money" title="Your money year" />
          <div className="stats">
            <div className="stat"><small>Spent</small><b>{usd(d.spent)}</b></div>
            <div className="stat"><small>Received</small><b>{usd(d.received)}</b></div>
            <div className="stat hl"><small>Debt paid off</small><b>{usd(d.debtsPaid)}</b></div>
          </div>
          <p className="year-callout">
            {d.debtsPaid > 0 ? <>You&apos;ve paid off <b>{usd(d.debtsPaid)}</b> of debt so far. That&apos;s freedom you bought yourself.</> : "Add your debts in Personal finance to celebrate every dollar paid off."}
            {d.savingsSaved > 0 && <> You have <b>{usd(d.savingsSaved)}</b> tucked away in savings goals.</>}
          </p>
          <p className="hint-sm">Spent and received are for {year}. Debt paid off and savings are your totals so far.</p>
        </section>

        <section className="card" aria-labelledby="h-y-biz">
          <CardHeader id="h-y-biz" icon="gem" eyebrow="Money & Grace Co." title="Your business year" meta={<><b>{usd(revenue)}</b>revenue</>} />
          <MonthBars values={byMonth} />
          <div className="minis">
            <div><small>Clients helped</small><b>{d.clientsHelped}</b></div>
            <div><small>Launches</small><b>{d.launches}</b></div>
            <div><small>Posts published</small><b>{d.posted}</b></div>
          </div>
          {revenue > 0 && <p className="year-callout">Your best month was <b>{MONTHS[bestMonth]}</b> with {usd(byMonth[bestMonth])}. Your clients have paid off <b>{usd(d.clientDebtPaid)}</b> of debt with your help.</p>}
        </section>
      </div>

      <section className="card" aria-labelledby="h-y-wins">
        <CardHeader id="h-y-wins" icon="star" eyebrow="Proud of you" title="Wins wall" meta={<><b>{num(wins.length)}</b>wins</>} />
        {wins.length === 0 ? <p className="empty">Add daily wins on your Today page. The best ones land on this wall.</p> : (
          <ul className="wins-wall">
            {spread(wins, 12).map((w, i) => (
              <li key={`${w.day}-${i}`} style={{ transform: `rotate(${[-2, 1.5, -1, 2, -1.5, 1][i % 6]}deg)` }}>
                <Icon name="heart" filled />
                <span>{w.text}</span>
                <small>{nice(w.day)}</small>
              </li>
            ))}
          </ul>
        )}
        {goalsDone > 0 && <p className="year-callout">Plus <b>{goalsDone}</b> {goalsDone === 1 ? "goal" : "goals"} completed, every step ticked off.</p>}
      </section>

      <Memories photos={photos} favorites={favorites} gratitude={gratitude} />

      <section className="year-close">
        <span className="s">Here&apos;s to {year + 1}</span>
        <p>Keep showing up for your pretty little life.</p>
      </section>
    </>
  );
}

function MonthBars({ values }: { values: number[] }) {
  const W = 420, H = 140, l = 8, r = 8, t = 18, b = 20;
  const max = Math.max(...values, 1);
  const cw = (W - l - r) / 12;
  const bw = Math.min(20, cw - 8);
  const y = (v: number) => t + (1 - v / max) * (H - t - b);
  const best = values.indexOf(Math.max(...values));
  const k = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="trend-svg" role="img" aria-label={`Revenue by month: ${values.map((v, i) => `${MONTHS[i]} ${usd(v)}`).join(", ")}`}>
      {values.map((v, i) => {
        const cx = l + cw * i + cw / 2;
        const h = v > 0 ? Math.max(3, y(0) - y(v)) : 0;
        return (
          <g key={i}>
            <rect x={cx - cw / 2} y={t} width={cw} height={H - t - b} fill="transparent"><title>{`${MONTHS[i]}: ${usd(v)}`}</title></rect>
            {h > 0 && (
              <path pointerEvents="none" fill={i === best ? "var(--hot)" : "var(--rose)"}
                d={`M${cx - bw / 2} ${y(0)} V${y(0) - h + 4} Q${cx - bw / 2} ${y(0) - h} ${cx - bw / 2 + 4} ${y(0) - h} H${cx + bw / 2 - 4} Q${cx + bw / 2} ${y(0) - h} ${cx + bw / 2} ${y(0) - h + 4} V${y(0)} Z`} />
            )}
            {i === best && v > 0 && <text x={cx} y={y(v) - 5} textAnchor="middle" fontSize="9.5" fill="var(--ink)">{k(v)}</text>}
            <text x={cx} y={H - 6} textAnchor="middle" fontSize="9" fill="var(--muted)">{MONTHS[i][0]}</text>
          </g>
        );
      })}
      <line x1={l} x2={W - r} y1={y(0)} y2={y(0)} stroke="var(--muted)" opacity=".5" />
    </svg>
  );
}

function Memories({ photos, favorites, gratitude }: {
  photos: { day: string; path: string }[]; favorites: YearData["journal"]; gratitude: { day: string; text: string }[];
}) {
  const picks = spread(photos, 12);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = picks.map((p) => p.path).join("|");
  useEffect(() => {
    let live = true;
    const paths = key ? key.split("|") : [];
    photoUrls(paths).then((u) => live && setUrls(u)).catch(() => {});
    return () => {
      live = false;
    };
  }, [key]);

  if (!photos.length && !favorites.length && !gratitude.length) return null;
  return (
    <section className="card" aria-labelledby="h-y-mem">
      <CardHeader id="h-y-mem" icon="journal" eyebrow="Dear diary" title="Memories" meta={<><b>{num(gratitude.length)}</b>things you were grateful for</>} />
      {picks.length > 0 && (
        <div className="year-photos">
          {picks.map((p) => (
            <figure key={p.path} className="photo">
              {urls[p.path] ? (
                // eslint-disable-next-line @next/next/no-img-element -- private, short-lived signed links
                <img src={urls[p.path]} alt={`Journal photo from ${nice(p.day)}`} loading="lazy" />
              ) : <span className="photo-ph">Loading…</span>}
              <figcaption>{nice(p.day)}</figcaption>
            </figure>
          ))}
        </div>
      )}
      {favorites.length > 0 && (
        <div className="year-pages">
          {favorites.map((j) => (
            <blockquote key={j.day}>
              <p>{j.body.trim().slice(0, 220)}{j.body.trim().length > 220 ? "…" : ""}</p>
              <cite>{nice(j.day)}</cite>
            </blockquote>
          ))}
        </div>
      )}
      {gratitude.length > 0 && (
        <p className="year-callout">
          A few things you were grateful for: {spread(gratitude, 5).map((g, i, arr) => (
            <span key={`${g.day}-${i}`}><b>{g.text}</b>{i < arr.length - 1 ? ", " : "."}</span>
          ))}
        </p>
      )}
    </section>
  );
}
