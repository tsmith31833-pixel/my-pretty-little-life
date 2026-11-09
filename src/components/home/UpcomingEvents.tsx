import Link from "next/link";
import { CardHeader } from "./CardHeader";
import { MONTHS, WEEKDAYS, addDays, formatMinutes, isoDate } from "@/lib/dates";
import type { PlannerEvent } from "@/lib/data";

type Props = { now: Date; monthEvents: PlannerEvent[]; upcoming: PlannerEvent[] };

export function UpcomingEvents({ now, monthEvents, upcoming }: Props) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prefix = `${y}-${String(m + 1).padStart(2, "0")}-`;
  const eventDays = new Set(monthEvents.filter((e) => e.day.startsWith(prefix)).map((e) => Number(e.day.slice(8))));
  const tomorrow = isoDate(addDays(now, 1));

  return (
    <section className="card" style={{ gridArea: "cal" }} aria-labelledby="h-cal">
      <CardHeader id="h-cal" icon="calendar" eyebrow="Coming up" title="Upcoming events" />
      <div className="mtitle">{MONTHS[m]} {y}</div>
      <div className="mini">
        {"SMTWTFS".split("").map((c, i) => <span className="dn" key={i}>{c}</span>)}
        {Array.from({ length: firstDay }, (_, i) => <span key={`blank-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1;
          const cls = ["d", d < now.getDate() && "past", d === now.getDate() && "today", eventDays.has(d) && "has"].filter(Boolean).join(" ");
          return <span className={cls} key={d}>{d}</span>;
        })}
      </div>
      <div className="up">
        {upcoming.length === 0 && <p className="empty">Nothing in the next 30 days yet. Add plans in the <Link href="/calendar">calendar</Link>.</p>}
        {upcoming.slice(0, 4).map((e) => {
          const d = new Date(`${e.day}T12:00:00`);
          return (
            <div className="up-i" key={e.id}>
              <div className="dtile"><small>{MONTHS[d.getMonth()].slice(0, 3)}</small><b>{d.getDate()}</b></div>
              <div>
                <p>{e.title}</p>
                <span>{e.day === tomorrow ? "Tomorrow" : WEEKDAYS[d.getDay()]} · {e.start_min === null ? "All day" : formatMinutes(e.start_min)}</span>
              </div>
            </div>
          );
        })}
        {upcoming.length > 4 && <Link className="see-all" href="/calendar">See all {upcoming.length} in the calendar</Link>}
      </div>
    </section>
  );
}
