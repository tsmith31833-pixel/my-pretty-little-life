"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import { Bow, Butterfly } from "../Ornaments";
import { AppShell, useShell } from "../shell/AppShell";
import { CardHeader } from "../home/CardHeader";
import { DeleteButton, Progress } from "../ui";
import {
  DEFAULT_HABITS, DEFAULT_THEMES, WEEKS, blankArc, createArc, currentWeek, deleteArc, getArc, saveArc, weekDates, weekProgress,
  type Arc, type ArcWeek, type Check,
} from "@/lib/arc";
import { MONTHS, WEEKDAYS, addDays, isoDate } from "@/lib/dates";
import { heartBurst } from "@/lib/hearts";

export function ArcScreen({ now }: { now: Date }) {
  return (
    <AppShell title="Winter Arc" crumb="12 weeks">
      <ArcBody now={now} />
    </AppShell>
  );
}

const short = (d: Date) => `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
const rid = () => Math.random().toString(36).slice(2, 9);

function ArcBody({ now }: { now: Date }) {
  const { toast } = useShell();
  const [arc, setArc] = useState<Arc | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef<Arc | null>(null);

  useEffect(() => {
    let live = true;
    getArc().then((a) => live && setArc(a)).catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  // Save any pending typing when leaving the page.
  useEffect(() => () => {
    if (timer.current && latest.current) saveArc(latest.current).catch(() => {});
  }, []);

  function update(fn: (a: Arc) => Arc, immediate = false) {
    if (!arc) return;
    const next = fn(arc);
    setArc(next);
    latest.current = next;
    clearTimeout(timer.current);
    const go = () => {
      timer.current = undefined;
      saveArc(next).catch(() => toast("Your Winter Arc didn't save. Check your internet connection and try again."));
    };
    if (immediate) go();
    else timer.current = setTimeout(go, 700);
  }

  if (failed) return <p className="auth-err">Your Winter Arc couldn&apos;t load. Check your internet connection, then refresh. If this is your first time here, run <b>supabase/phase10.sql</b> in Supabase.</p>;
  if (arc === undefined) return <p className="empty">Loading your Winter Arc…</p>;
  if (arc === null) return <ArcSetup now={now} onCreated={(a) => { setArc(a); toast("Your Winter Arc begins. Let's go!"); }} />;

  const cw = currentWeek(arc, now);
  const week = selected ?? Math.max(0, Math.min(WEEKS - 1, cw));
  const end = addDays(new Date(`${arc.start_day}T12:00:00`), WEEKS * 7 - 1);
  const daysLeft = Math.max(0, Math.round((end.getTime() - new Date(isoDate(now) + "T12:00:00").getTime()) / 864e5) + 1);
  const finishedWeeks = Math.min(WEEKS, Math.max(0, cw));
  const overall = Array.from({ length: Math.min(WEEKS, cw + 1) }, (_, i) => weekProgress(arc, i, now));
  const overallPct = overall.length ? Math.round((overall.reduce((a, b) => a + b, 0) / overall.length) * 100) : 0;
  const status = cw < 0
    ? `Starts ${WEEKDAYS[new Date(`${arc.start_day}T12:00:00`).getDay()]}, ${short(new Date(`${arc.start_day}T12:00:00`))}`
    : cw >= WEEKS ? "Complete. You did it!" : `Week ${cw + 1} of ${WEEKS} · ${daysLeft} ${daysLeft === 1 ? "day" : "days"} to go`;
  const CIRC = 263.9;

  return (
    <>
      <section className="arc-hero" aria-label={arc.name}>
        <Bow className="yh-bow" />
        <Butterfly style={{ right: "10%", top: "16%" }} />
        <span className="eyebrow">12-week challenge</span>
        <h2 className="yh-title">{arc.name}</h2>
        <p className="arc-dates">{short(new Date(`${arc.start_day}T12:00:00`))} – {short(end)}, {end.getFullYear()}</p>
        <div className="arc-status">
          <div className="ring">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--blush)" strokeWidth="9" />
              <circle className="prog" cx="50" cy="50" r="42" fill="none" stroke="var(--hot)" strokeWidth="9" strokeLinecap="round"
                strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - overallPct / 100)} style={{ "--c": CIRC } as React.CSSProperties} />
            </svg>
            <div className="rv"><b>{overallPct}%</b><small>so far</small></div>
          </div>
          <div className="arc-status-t">
            <b>{status}</b>
            <span>{finishedWeeks} {finishedWeeks === 1 ? "week" : "weeks"} behind you · {arc.data.goals.filter((g) => g.done).length} of {arc.data.goals.length} arc goals done</span>
          </div>
        </div>
      </section>

      <section className="card" aria-labelledby="h-arc-weeks">
        <CardHeader id="h-arc-weeks" icon="calendar" eyebrow="Your 12 weeks" title="Week by week" />
        <div className="arc-weeks">
          {arc.data.weeks.map((w, i) => {
            const dates = weekDates(arc, i);
            const pct = Math.round(weekProgress(arc, i, now) * 100);
            const cls = ["arc-week", i === cw && "now", i === week && "sel", i < cw && "past", i > cw && "future"].filter(Boolean).join(" ");
            return (
              <button type="button" key={i} className={cls} onClick={() => setSelected(i)} aria-pressed={i === week}
                aria-label={`Week ${i + 1}, ${w.theme}, ${short(dates[0])} to ${short(dates[6])}${i <= cw ? `, ${pct}% done` : ""}`}>
                <span className="aw-num">Week {i + 1}</span>
                <span className="aw-theme">{w.theme}</span>
                <span className="aw-dates">{short(dates[0])} – {short(dates[6])}</span>
                {i <= cw ? <Progress value={pct} max={100} /> : <span className="aw-soon">{i === cw + 1 ? "Up next" : " "}</span>}
                {w.rating > 0 && <span className="aw-rating" aria-hidden="true">{"♥".repeat(w.rating)}</span>}
              </button>
            );
          })}
        </div>
      </section>

      <div className="split">
        <WeekDetail arc={arc} i={week} now={now}
          onChange={(fn, immediate) => update((a) => ({ ...a, data: { ...a.data, weeks: a.data.weeks.map((w, j) => (j === week ? fn(w) : w)) } }), immediate)} />

        <div className="stack">
          <section className="card" aria-labelledby="h-arc-goals">
            <CardHeader id="h-arc-goals" icon="star" eyebrow="By the end" title="Arc goals" />
            <Checklist items={arc.data.goals} placeholder="Add an arc goal" idPrefix="ag"
              onChange={(goals, immediate) => update((a) => ({ ...a, data: { ...a.data, goals } }), immediate)} />
          </section>

          <section className="card" aria-labelledby="h-arc-set">
            <CardHeader id="h-arc-set" icon="gear" eyebrow="Settings" title="Arc details" />
            {editing ? (
              <form className="pform" onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const names = String(f.get("habits")).split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 10);
                update((a) => {
                  const habits = names.map((n) => a.data.habits.find((h) => h.name === n) ?? { id: `h_${rid()}`, name: n });
                  return { ...a, name: String(f.get("name")).trim() || a.name, start_day: String(f.get("start")) || a.start_day, data: { ...a.data, habits } };
                }, true);
                setEditing(false);
                toast("Arc updated.");
              }}>
                <label className="full">Name<input id="arc-name" name="name" defaultValue={arc.name} maxLength={40} /></label>
                <label className="full">Start date<input id="arc-start" name="start" type="date" defaultValue={arc.start_day} /></label>
                <label className="full">Daily non-negotiables <small>(one per line, up to 10)</small>
                  <textarea id="arc-habits" name="habits" rows={6} defaultValue={arc.data.habits.map((h) => h.name).join("\n")} />
                </label>
                <div className="form-actions full">
                  <button type="button" className="btn ghost sm" onClick={() => setEditing(false)}>Cancel</button>
                  <button type="submit" className="btn sm">Save</button>
                </div>
              </form>
            ) : (
              <>
                <p className="lede-sm">Daily non-negotiables: {arc.data.habits.map((h) => h.name).join(" · ") || "none yet"}</p>
                <div className="card-foot wrap">
                  <button type="button" className="btn ghost sm" onClick={() => setEditing(true)}>Edit details</button>
                  <DeleteButton label="Delete this arc and start over" text="Delete arc?" onConfirm={async () => {
                    try {
                      await deleteArc(arc.id);
                      setArc(null);
                      setSelected(null);
                      toast("Arc deleted.");
                    } catch {
                      toast("The arc wasn't deleted. Check your internet connection and try again.");
                    }
                  }} />
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function Checklist({ items, onChange, placeholder, idPrefix }: { items: Check[]; onChange: (c: Check[], immediate?: boolean) => void; placeholder: string; idPrefix: string }) {
  return (
    <>
      {items.length === 0 && <p className="empty">Nothing here yet.</p>}
      <ul className="ms-list">
        {items.map((g) => (
          <li key={g.id} className={g.done ? "done" : ""}>
            <button type="button" className={`chk sm${g.done ? " on" : ""}`} aria-pressed={g.done} aria-label={`${g.text}, ${g.done ? "done" : "not done"}`}
              onClick={(e) => { if (!g.done) heartBurst(e.currentTarget); onChange(items.map((x) => (x.id === g.id ? { ...x, done: !x.done } : x)), true); }}>
              <Icon name="check" strokeWidth={2.4} />
            </button>
            <span>{g.text}</span>
            <button type="button" className="iconbtn tiny" aria-label={`Remove ${g.text}`} onClick={() => onChange(items.filter((x) => x.id !== g.id), true)}><Icon name="x" /></button>
          </li>
        ))}
      </ul>
      <form className="ms-add" onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem("item") as HTMLInputElement;
        const v = input.value.trim();
        if (!v) return;
        input.value = "";
        onChange([...items, { id: rid(), text: v, done: false }], true);
      }}>
        <label htmlFor={`${idPrefix}-add`} className="sr-only">{placeholder}</label>
        <input id={`${idPrefix}-add`} name="item" placeholder={`${placeholder}…`} maxLength={160} />
        <button type="submit" className="iconbtn" aria-label={placeholder}><Icon name="plus" /></button>
      </form>
    </>
  );
}

function WeekDetail({ arc, i, now, onChange }: { arc: Arc; i: number; now: Date; onChange: (fn: (w: ArcWeek) => ArcWeek, immediate?: boolean) => void }) {
  const w = arc.data.weeks[i];
  const dates = weekDates(arc, i);
  const today = isoDate(now);
  const pct = Math.round(weekProgress(arc, i, now) * 100);
  return (
    <section className="card arc-detail" aria-labelledby="h-week" key={i}>
      <header className="card-h">
        <span className="badge"><Icon name="sparkle" /></span>
        <div>
          <span className="eyebrow">Week {i + 1} · {short(dates[0])} – {short(dates[6])}</span>
          <h2 id="h-week">
            <label htmlFor="week-theme" className="sr-only">Week theme</label>
            <input id="week-theme" className="theme-in" defaultValue={w.theme} maxLength={60}
              onChange={(e) => { const v = e.currentTarget.value; onChange((x) => ({ ...x, theme: v || DEFAULT_THEMES[i] })); }} />
          </h2>
        </div>
        <span className="meta"><b>{pct}%</b>done</span>
      </header>

      <label className="focus-line">
        <span className="eyebrow">This week&apos;s focus</span>
        <input id="week-focus" defaultValue={w.focus} placeholder="One sentence: what matters most this week?" maxLength={200}
          onChange={(e) => { const v = e.currentTarget.value; onChange((x) => ({ ...x, focus: v })); }} />
      </label>

      <div className="arc-block">
        <h3 className="arc-h">Weekly goals</h3>
        <Checklist items={w.goals} placeholder="Add a goal for this week" idPrefix={`wg${i}`} onChange={(goals, immediate) => onChange((x) => ({ ...x, goals }), immediate)} />
      </div>

      <div className="arc-block">
        <h3 className="arc-h">Daily non-negotiables</h3>
        {arc.data.habits.length === 0 ? <p className="empty">Add daily non-negotiables in Arc details.</p> : (
          <div className="hgrid arc-grid">
            <div className="hrow hhead" aria-hidden="true">
              <span className="hname" />
              <div className="hcells">
                {dates.map((d) => <span key={isoDate(d)} className={`dh${isoDate(d) === today ? " today" : ""}`}>{WEEKDAYS[d.getDay()][0]}<br />{d.getDate()}</span>)}
              </div>
              <span className="dh streak">Done</span>
            </div>
            {arc.data.habits.map((h) => {
              const row = w.checks[h.id] ?? Array(7).fill(false);
              const n = row.filter(Boolean).length;
              return (
                <div className="hrow" key={h.id}>
                  <div className="hname"><span>{h.name}</span></div>
                  <div className="hcells">
                    {dates.map((d, di) => {
                      const future = isoDate(d) > today;
                      return (
                        <button key={di} type="button" disabled={future} className={`hcell${row[di] ? " on" : ""}${isoDate(d) === today ? " today" : ""}`}
                          aria-pressed={!!row[di]} aria-label={`${h.name}, ${WEEKDAYS[d.getDay()]} ${short(d)}`}
                          onClick={(e) => {
                            if (!row[di]) heartBurst(e.currentTarget);
                            onChange((x) => {
                              const r = [...(x.checks[h.id] ?? Array(7).fill(false))];
                              r[di] = !r[di];
                              return { ...x, checks: { ...x.checks, [h.id]: r } };
                            }, true);
                          }}>
                          <Icon name="heart" filled={!!row[di]} strokeWidth={1.8} />
                        </button>
                      );
                    })}
                  </div>
                  <span className="streak"><b>{n}</b>/7</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="arc-block">
        <h3 className="arc-h">Weekly reflection</h3>
        <div className="pform">
          <label className="full">Wins this week<textarea id="week-wins" rows={3} defaultValue={w.wins} placeholder="What went well? What are you proud of?" maxLength={2000}
            onChange={(e) => { const v = e.currentTarget.value; onChange((x) => ({ ...x, wins: v })); }} /></label>
          <label className="full">Lessons & next week<textarea id="week-lessons" rows={3} defaultValue={w.lessons} placeholder="What will you do differently?" maxLength={2000}
            onChange={(e) => { const v = e.currentTarget.value; onChange((x) => ({ ...x, lessons: v })); }} /></label>
        </div>
        <div className="rating" role="radiogroup" aria-label="How did this week feel?">
          <span className="eyebrow">How did this week feel?</span>
          <div>
            {[1, 2, 3, 4, 5].map((r) => (
              <button key={r} type="button" role="radio" aria-checked={w.rating === r} aria-label={`${r} out of 5`} className={`rate${r <= w.rating ? " on" : ""}`}
                onClick={(e) => { if (r === 5) heartBurst(e.currentTarget); onChange((x) => ({ ...x, rating: x.rating === r ? 0 : r }), true); }}>
                <Icon name="heart" filled={r <= w.rating} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ArcSetup({ now, onCreated }: { now: Date; onCreated: (a: Arc) => void }) {
  const { toast } = useShell();
  const [busy, setBusy] = useState(false);
  // Default start: next Monday (or today if it's Monday).
  const toMonday = (8 - now.getDay()) % 7;
  const defaultStart = isoDate(addDays(now, toMonday));
  return (
    <section className="card arc-setup" aria-labelledby="h-setup">
      <Bow className="orn" style={{ width: 64, right: 22, top: -18 }} />
      <CardHeader id="h-setup" icon="sparkle" eyebrow="12 weeks to your best winter" title="Start your Winter Arc" />
      <p className="lede-sm">Set your start date, your big goals and the things you&apos;ll do every day. Each of the 12 weeks gets a theme, its own goals, a daily tracker and a reflection. You can change everything later.</p>
      <form className="pform" onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const lines = (k: string) => String(f.get(k) ?? "").split("\n");
        setBusy(true);
        try {
          onCreated(await createArc(blankArc(String(f.get("start")), lines("goals"), lines("habits"), lines("themes"))));
        } catch {
          toast("Your arc didn't save. If this is your first time here, run supabase/phase10.sql in Supabase.");
          setBusy(false);
        }
      }}>
        <label>Start date<input id="setup-start" name="start" type="date" defaultValue={defaultStart} required /></label>
        <span className="hint-sm setup-end">12 weeks = 84 days</span>
        <label className="full">Arc goals <small>(one per line)</small>
          <textarea id="setup-goals" name="goals" rows={4} placeholder={"Pay off the store card\nPost 3 times a week\nLaunch Debt-Free by Spring"} />
        </label>
        <label className="full">Daily non-negotiables <small>(one per line)</small>
          <textarea id="setup-habits" name="habits" rows={6} defaultValue={DEFAULT_HABITS.join("\n")} />
        </label>
        <label className="full">Week themes <small>(one per line, 12 lines; change any you like)</small>
          <textarea id="setup-themes" name="themes" rows={12} defaultValue={DEFAULT_THEMES.join("\n")} />
        </label>
        <div className="form-actions full"><button type="submit" className="btn" disabled={busy}>{busy ? "Starting…" : "Start my Winter Arc"}</button></div>
      </form>
    </section>
  );
}
