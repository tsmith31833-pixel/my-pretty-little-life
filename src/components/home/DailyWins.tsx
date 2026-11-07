"use client";

import { useRef } from "react";
import { Icon } from "../Icon";
import { Butterfly } from "../Ornaments";
import { CardHeader } from "./CardHeader";
import { heartBurst } from "@/lib/hearts";

type Props = { wins: string[]; onChange: (w: string[]) => void; toast: (m: string) => void };

export function DailyWins({ wins, onChange, toast }: Props) {
  const listRef = useRef<HTMLUListElement>(null);

  function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("winInput") as HTMLInputElement;
    const v = input.value.trim();
    if (!v) {
      toast("Type a win first, even a tiny one.");
      return;
    }
    onChange([v, ...wins]);
    input.value = "";
    toast("Win added. Proud of you.");
    requestAnimationFrame(() => heartBurst(listRef.current?.firstElementChild ?? null));
  }

  return (
    <section className="card" style={{ gridArea: "wins" }} aria-labelledby="h-wins">
      <div className="orn" style={{ width: 46, right: 20, top: -16 }}>
        <Butterfly style={{ position: "static", width: 46, animationDuration: "9s" }} />
      </div>
      <CardHeader
        id="h-wins"
        icon="star"
        eyebrow="Celebrate yourself"
        title="Daily wins"
        meta={<><b>{wins.length}</b>{wins.length === 1 ? "win" : "wins"} today</>}
      />
      <form className="winform" onSubmit={add} autoComplete="off">
        <label htmlFor="winInput" className="sr-only">New win</label>
        <input id="winInput" name="winInput" type="text" maxLength={120} placeholder="I'm proud that I…" />
        <button className="btn" type="submit">Add win</button>
      </form>
      <ul className="wins" ref={listRef}>
        {wins.length === 0 ? (
          <li className="empty" style={{ background: "transparent" }}>Your first win of the day goes here. Small ones count.</li>
        ) : (
          wins.map((w, i) => (
            <li key={`${w}-${i}`}>
              <Icon name="heart" filled />
              <span>{w}</span>
              <button type="button" aria-label={`Remove win: ${w}`} onClick={() => onChange(wins.filter((_, j) => j !== i))}>
                <Icon name="x" />
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
