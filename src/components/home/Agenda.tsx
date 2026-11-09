import { Fragment } from "react";
import Link from "next/link";
import { CardHeader } from "./CardHeader";
import { formatMinutes } from "@/lib/dates";
import type { PlannerEvent } from "@/lib/data";

const ends = (e: PlannerEvent) => (e.start_min ?? 0) + e.minutes;

/** Timed events today that haven't finished yet. */
export function agendaLeft(events: PlannerEvent[], nowMinutes: number) {
  return events.filter((e) => e.start_min === null || ends(e) > nowMinutes).length;
}

type Props = { events: PlannerEvent[]; loading: boolean; failed: boolean; nowMinutes: number };

export function Agenda({ events, loading, failed, nowMinutes }: Props) {
  const allDay = events.filter((e) => e.start_min === null);
  const timed = events.filter((e) => e.start_min !== null);
  const nextIdx = timed.findIndex((e) => e.start_min! > nowMinutes);
  const nowLineAt = nextIdx === -1 ? timed.length : nextIdx;
  const nowLine = <div className="nowline"><span>Now</span><i /></div>;

  return (
    <section className="card" style={{ gridArea: "agenda" }} aria-labelledby="h-ag">
      <CardHeader id="h-ag" icon="sun" eyebrow="Hour by hour" title="Today's agenda" meta={<><b>{agendaLeft(events, nowMinutes)}</b>still ahead</>} />
      {failed && <p className="auth-err">Your agenda couldn&apos;t load. Check your internet connection, then refresh.</p>}
      {loading && <p className="empty">Loading your day…</p>}
      {!loading && !failed && events.length === 0 && (
        <p className="empty">Nothing scheduled today. Tap the pink <b>+</b> to add an event, or open the <Link href="/calendar">calendar</Link>.</p>
      )}
      <div className="agenda">
        {allDay.map((e) => (
          <div key={e.id} className="ev" data-tag={e.tag}>
            <time>All day</time>
            <div className="box"><b>{e.title}</b><span>{e.tag}</span></div>
          </div>
        ))}
        {timed.map((e, i) => {
          const past = ends(e) <= nowMinutes;
          const happening = !past && e.start_min! <= nowMinutes;
          const next = i === nextIdx;
          const cls = past ? "past" : happening || next ? "next" : "";
          return (
            <Fragment key={e.id}>
              {i === nowLineAt && i > 0 && nowLine}
              <div className={`ev ${cls}`} data-tag={e.tag}>
                <time>{formatMinutes(e.start_min!)}</time>
                <div className="box">
                  {happening && <span className="tagnext">Happening now</span>}
                  {next && <span className="tagnext">Up next</span>}
                  <b>{e.title}</b>
                  <span>{e.tag} · {e.minutes} min</span>
                </div>
              </div>
            </Fragment>
          );
        })}
        {timed.length > 0 && nowLineAt === timed.length && nowLine}
      </div>
    </section>
  );
}
