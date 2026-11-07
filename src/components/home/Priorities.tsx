import { Icon } from "../Icon";
import { Bow } from "../Ornaments";
import { CardHeader } from "./CardHeader";
import { heartBurst } from "@/lib/hearts";
import type { Priority } from "@/lib/planner-store";

type Props = { priorities: Priority[]; onChange: (p: Priority[]) => void; toast: (m: string) => void };

export function Priorities({ priorities, onChange, toast }: Props) {
  const done = priorities.filter((p) => p.done).length;

  function toggle(i: number, el: HTMLElement) {
    const next = priorities.map((p, j) => (j === i ? { ...p, done: !p.done } : p));
    onChange(next);
    if (next[i].done) {
      heartBurst(el);
      toast(next.every((p) => p.done) ? "All three done. You are glowing." : "Priority done. One step closer.");
    }
  }

  function rename(i: number, text: string) {
    const t = text.trim();
    if (!t || t === priorities[i].text) return;
    onChange(priorities.map((p, j) => (j === i ? { ...p, text: t } : p)));
  }

  return (
    <section className="card" style={{ gridArea: "prio" }} aria-labelledby="h-prio">
      <Bow className="orn" style={{ width: 64, right: 18, top: -18 }} />
      <CardHeader id="h-prio" icon="heart" eyebrow="Focus" title="Top three priorities" meta={<><b>{done} of 3</b>done</>} />
      <div className="prio">
        {priorities.map((p, i) => (
          <div className={`p-item${p.done ? " done" : ""}`} key={i}>
            <div className="p-top">
              <span className="p-num">{i + 1}</span>
              <button
                type="button"
                className={`chk${p.done ? " on" : ""}`}
                aria-pressed={p.done}
                aria-label={`Mark priority ${i + 1} done`}
                onClick={(e) => toggle(i, e.currentTarget)}
              >
                <Icon name="check" strokeWidth={2.4} />
              </button>
            </div>
            <textarea
              id={`priority-${i + 1}`}
              className="p-text"
              rows={2}
              defaultValue={p.text}
              key={p.text}
              aria-label={`Priority ${i + 1}`}
              onBlur={(e) => rename(i, e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
            />
            <span className="hint">Tap text to edit</span>
          </div>
        ))}
      </div>
    </section>
  );
}
