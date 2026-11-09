import { Icon } from "../Icon";
import { CardHeader } from "./CardHeader";
import type { HabitDef } from "@/lib/data";
import { WEEKDAYS } from "@/lib/dates";
import { heartBurst } from "@/lib/hearts";
import type { WeekState } from "@/lib/planner-store";

type Props = {
  habits: HabitDef[];
  week: WeekState;
  todayIdx: number;
  onToggle: (id: string, day: number) => boolean;
  gridArea?: string;
  footer?: React.ReactNode;
};

function streak(row: boolean[], todayIdx: number) {
  let i = row[todayIdx] ? todayIdx : todayIdx - 1;
  let n = 0;
  while (i >= 0 && row[i]) { n++; i--; }
  return n;
}

export function habitsLeftToday(habits: HabitDef[], week: WeekState, todayIdx: number) {
  return habits.filter((h) => !week[h.id]?.[todayIdx]).length;
}

export function HabitTracker({ habits, week, todayIdx, onToggle, gridArea = "habit", footer }: Props) {
  let total = 0;
  let done = 0;
  for (const h of habits) for (let d = 0; d <= todayIdx; d++) { total++; if (week[h.id]?.[d]) done++; }
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <section className="card" style={{ gridArea }} aria-labelledby="h-hab">
      <CardHeader id="h-hab" icon="sparkle" eyebrow="Glow-up 2027" title="Habit tracker" meta={<><b>{pct}%</b>this week</>} />
      <div className="hgrid">
        <div className="hrow hhead" aria-hidden="true">
          <span className="hname" />
          <div className="hcells">
            {"SMTWTFS".split("").map((c, d) => (
              <span key={d} className={`dh${d === todayIdx ? " today" : ""}`}>{c}</span>
            ))}
          </div>
          <span className="dh streak">Streak</span>
        </div>
        {habits.map((h) => {
          const row = week[h.id] ?? Array(7).fill(false);
          const count = row.slice(0, todayIdx + 1).filter(Boolean).length;
          const days = streak(row, todayIdx);
          return (
            <div key={h.id} className="hrow">
              <div className="hname">
                <span>{h.name}</span>
                <div className="bar"><i style={{ width: `${Math.round((count / (todayIdx + 1)) * 100)}%`, animation: "none" }} /></div>
              </div>
              <div className="hcells">
                {row.map((on: boolean, d: number) => (
                  <button
                    key={d}
                    type="button"
                    className={`hcell${on ? " on" : ""}${d === todayIdx ? " today" : ""}`}
                    disabled={d > todayIdx}
                    aria-pressed={on}
                    aria-label={`${h.name}, ${WEEKDAYS[d]}`}
                    onClick={(e) => {
                      const el = e.currentTarget;
                      if (onToggle(h.id, d)) {
                        el.classList.remove("pop");
                        void el.offsetWidth;
                        el.classList.add("pop");
                        heartBurst(el);
                      }
                    }}
                  >
                    <Icon name="heart" filled={on} strokeWidth={1.8} />
                  </button>
                ))}
              </div>
              <span className="streak"><b>{days}</b> {days === 1 ? "day" : "days"}</span>
            </div>
          );
        })}
      </div>
      <div className="hsum">
        <div className="bar"><i style={{ width: `${pct}%` }} /></div>
        <span>{done} of {total} check-ins so far this week</span>
      </div>
      {footer}
    </section>
  );
}
