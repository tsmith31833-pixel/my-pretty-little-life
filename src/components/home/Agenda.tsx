import { Fragment } from "react";
import { CardHeader } from "./CardHeader";
import { AGENDA } from "@/lib/sample-data";
import { formatMinutes } from "@/lib/dates";

export function agendaLeft(nowMinutes: number) {
  return AGENDA.filter((e) => e.start + e.minutes > nowMinutes).length;
}

export function Agenda({ nowMinutes }: { nowMinutes: number }) {
  const nextIdx = AGENDA.findIndex((e) => e.start > nowMinutes);
  const nowLineAt = nextIdx === -1 ? AGENDA.length : nextIdx;
  const nowLine = (
    <div className="nowline"><span>Now</span><i /></div>
  );
  return (
    <section className="card" style={{ gridArea: "agenda" }} aria-labelledby="h-ag">
      <CardHeader id="h-ag" icon="sun" eyebrow="Hour by hour" title="Today's agenda" meta={<><b>{agendaLeft(nowMinutes)}</b>still ahead</>} />
      <div className="agenda">
        {AGENDA.map((e, i) => {
          const past = e.start + e.minutes <= nowMinutes;
          const happening = !past && e.start <= nowMinutes;
          const next = i === nextIdx;
          const cls = past ? "past" : happening || next ? "next" : "";
          return (
            <Fragment key={e.title}>
              {i === nowLineAt && i > 0 && nowLine}
              <div className={`ev ${cls}`} data-tag={e.tag}>
                <time>{formatMinutes(e.start)}</time>
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
        {nowLineAt === AGENDA.length && nowLine}
      </div>
    </section>
  );
}
