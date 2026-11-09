"use client";

import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { AppShell, useShell } from "../shell/AppShell";
import { EventForm } from "./EventForm";
import { deleteEvent, listEvents, type PlannerEvent } from "@/lib/data";
import { MONTHS, WEEKDAYS, addDays, formatMinutes, isoDate } from "@/lib/dates";

export function CalendarScreen({ now }: { now: Date }) {
  return (
    <AppShell title="Calendar" crumb={`${MONTHS[now.getMonth()]} ${now.getFullYear()}`}>
      <CalendarBody now={now} />
    </AppShell>
  );
}

const fromIso = (s: string) => new Date(`${s}T12:00:00`);
const timeLabel = (e: PlannerEvent) => (e.start_min === null ? "All day" : formatMinutes(e.start_min));

function CalendarBody({ now }: { now: Date }) {
  const { toast, version } = useShell();
  const today = isoDate(now);
  const [view, setView] = useState<"month" | "week">("month");
  const [selected, setSelected] = useState(today);
  const [events, setEvents] = useState<PlannerEvent[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState<PlannerEvent | "new" | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Visible range: 6 weeks for month view, 1 week for week view, both starting on Sunday.
  const sel = fromIso(selected);
  const monthStart = new Date(sel.getFullYear(), sel.getMonth(), 1);
  const rangeStart = view === "month" ? addDays(monthStart, -monthStart.getDay()) : addDays(sel, -sel.getDay());
  const days = Array.from({ length: view === "month" ? 42 : 7 }, (_, i) => addDays(rangeStart, i));
  const from = isoDate(days[0]);
  const to = isoDate(days[days.length - 1]);

  useEffect(() => {
    let live = true;
    listEvents(from, to)
      .then((rows) => live && (setEvents(rows), setFailed(false)))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [from, to, version, reload]);

  const byDay = new Map<string, PlannerEvent[]>();
  for (const e of events ?? []) byDay.set(e.day, [...(byDay.get(e.day) ?? []), e]);
  const dayEvents = byDay.get(selected) ?? [];

  function move(step: number) {
    setEditing(null);
    if (view === "month") {
      const d = new Date(sel.getFullYear(), sel.getMonth() + step, 1);
      setSelected(isoDate(d));
    } else {
      setSelected(isoDate(addDays(sel, step * 7)));
    }
  }

  async function remove(e: PlannerEvent) {
    if (confirmId !== e.id) {
      setConfirmId(e.id);
      return;
    }
    setConfirmId(null);
    setEvents((rows) => rows?.filter((r) => r.id !== e.id) ?? null);
    try {
      await deleteEvent(e.id);
      toast("Event deleted.");
    } catch {
      toast("The event wasn't deleted. Check your internet connection and try again.");
      setReload((r) => r + 1);
    }
  }

  const heading =
    view === "month"
      ? `${MONTHS[sel.getMonth()]} ${sel.getFullYear()}`
      : `${MONTHS[days[0].getMonth()].slice(0, 3)} ${days[0].getDate()} – ${MONTHS[days[6].getMonth()].slice(0, 3)} ${days[6].getDate()}`;

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Your calendar</span>
          <h2 className="page-title">{heading}</h2>
        </div>
        <div className="cal-ctrls">
          <button type="button" className="iconbtn round" aria-label={view === "month" ? "Previous month" : "Previous week"} onClick={() => move(-1)}>‹</button>
          <button type="button" className="btn ghost sm" onClick={() => { setSelected(today); setEditing(null); }}>Today</button>
          <button type="button" className="iconbtn round" aria-label={view === "month" ? "Next month" : "Next week"} onClick={() => move(1)}>›</button>
          <div className="seg" role="tablist" aria-label="Calendar view">
            <button type="button" role="tab" aria-selected={view === "month"} className={view === "month" ? "on" : ""} onClick={() => setView("month")}>Month</button>
            <button type="button" role="tab" aria-selected={view === "week"} className={view === "week" ? "on" : ""} onClick={() => setView("week")}>Week</button>
          </div>
        </div>
      </div>

      {failed && <p className="auth-err">Your calendar couldn&apos;t load. Check your internet connection, then refresh. If this is your first time here, run <b>supabase/phase2.sql</b> in Supabase.</p>}

      <div className="split cal-split">
        <section className="card cal-card" aria-label="Calendar">
          <div className={`cal-grid ${view}`}>
            {WEEKDAYS.map((w) => <span key={w} className="cal-dn">{w.slice(0, 3)}</span>)}
            {days.map((d) => {
              const key = isoDate(d);
              const evs = byDay.get(key) ?? [];
              const out = view === "month" && d.getMonth() !== sel.getMonth();
              const cls = ["cal-cell", out && "out", key === today && "today", key === selected && "sel", key < today && "past"].filter(Boolean).join(" ");
              return (
                <button type="button" key={key} className={cls} onClick={() => { setSelected(key); setEditing(null); }} aria-label={`${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}: ${evs.length} ${evs.length === 1 ? "event" : "events"}`}>
                  <span className="cal-num">{d.getDate()}</span>
                  <span className="cal-evs">
                    {evs.slice(0, view === "week" ? 6 : 2).map((e) => (
                      <span key={e.id} className="cal-ev" data-tag={e.tag}>
                        {view === "week" && <b>{timeLabel(e)}</b>}
                        {e.title}
                      </span>
                    ))}
                    {evs.length > (view === "week" ? 6 : 2) && <span className="cal-more">+{evs.length - (view === "week" ? 6 : 2)} more</span>}
                  </span>
                  {evs.length > 0 && <span className="cal-dots" aria-hidden="true">{evs.slice(0, 3).map((e) => <i key={e.id} data-tag={e.tag} />)}</span>}
                </button>
              );
            })}
          </div>
        </section>

        <section className="card day-card" aria-labelledby="h-day">
          <header className="card-h">
            <div className="dtile big"><small>{MONTHS[sel.getMonth()].slice(0, 3)}</small><b>{sel.getDate()}</b></div>
            <div>
              <span className="eyebrow">{selected === today ? "Today" : WEEKDAYS[sel.getDay()]}</span>
              <h2 id="h-day">{dayEvents.length ? `${dayEvents.length} ${dayEvents.length === 1 ? "event" : "events"}` : "A free day"}</h2>
            </div>
            {editing === null && (
              <button type="button" className="btn sm add-ev" onClick={() => setEditing("new")}><Icon name="plus" strokeWidth={2.2} />Add</button>
            )}
          </header>

          {editing !== null ? (
            <EventForm
              key={editing === "new" ? `new-${selected}` : editing.id}
              day={selected}
              existing={editing === "new" ? undefined : editing}
              onCancel={() => setEditing(null)}
              onSaved={() => {
                toast(editing === "new" ? "Event added." : "Event updated.");
                setEditing(null);
                setReload((r) => r + 1);
              }}
            />
          ) : (
            <>
              {events !== null && dayEvents.length === 0 && <p className="empty">Nothing planned. Tap <b>Add</b> to schedule something lovely.</p>}
              <div className="agenda">
                {dayEvents.map((e) => (
                  <div key={e.id} className="ev" data-tag={e.tag}>
                    <time>{timeLabel(e)}</time>
                    <div className="box ev-edit">
                      <button type="button" className="ev-open" onClick={() => setEditing(e)} aria-label={`Edit ${e.title}`}>
                        <b>{e.title}</b>
                        <span>{e.tag}{e.start_min !== null ? ` · ${e.minutes} min` : ""}{e.notes ? ` · ${e.notes}` : ""}</span>
                      </button>
                      <button type="button" className={`iconbtn del${confirmId === e.id ? " confirm" : ""}`} onClick={() => remove(e)} onBlur={() => setConfirmId(null)} aria-label={`Delete ${e.title}`}>
                        {confirmId === e.id ? "Delete?" : <Icon name="x" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
