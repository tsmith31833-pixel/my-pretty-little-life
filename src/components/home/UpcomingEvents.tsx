import { CardHeader } from "./CardHeader";
import { UPCOMING } from "@/lib/sample-data";
import { MONTHS, WEEKDAYS, addDays } from "@/lib/dates";

export function UpcomingEvents({ now }: { now: Date }) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const eventDays = new Set(
    UPCOMING.map(([offset]) => addDays(now, offset))
      .filter((d) => d.getMonth() === m)
      .map((d) => d.getDate()),
  );

  return (
    <section className="card" style={{ gridArea: "cal" }} aria-labelledby="h-cal">
      <CardHeader id="h-cal" icon="calendar" eyebrow="Coming up" title="Upcoming events" />
      <div className="mtitle">
        {MONTHS[m]} {y}
      </div>
      <div className="mini">
        {"SMTWTFS".split("").map((c, i) => (
          <span className="dn" key={i}>{c}</span>
        ))}
        {Array.from({ length: firstDay }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1;
          const cls = ["d", d < now.getDate() && "past", d === now.getDate() && "today", eventDays.has(d) && "has"]
            .filter(Boolean)
            .join(" ");
          return (
            <span className={cls} key={d}>{d}</span>
          );
        })}
      </div>
      <div className="up">
        {UPCOMING.slice(0, 4).map(([offset, title, time]) => {
          const d = addDays(now, offset);
          return (
            <div className="up-i" key={title}>
              <div className="dtile">
                <small>{MONTHS[d.getMonth()].slice(0, 3)}</small>
                <b>{d.getDate()}</b>
              </div>
              <div>
                <p>{title}</p>
                <span>
                  {offset === 1 ? "Tomorrow" : WEEKDAYS[d.getDay()]} · {time}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
