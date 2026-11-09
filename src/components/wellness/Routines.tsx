"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { CardHeader } from "../home/CardHeader";
import { heartBurst } from "@/lib/hearts";
import { newId } from "@/lib/settings";
import type { Routine } from "@/lib/data";

type Props = {
  routines: Routine[];
  checks: Record<string, boolean[]>;
  onCheck: (checks: Record<string, boolean[]>) => void;
  onChangeRoutines: (r: Routine[]) => void;
};

export function Routines({ routines, checks, onCheck, onChangeRoutines }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function tick(r: Routine, i: number, el: HTMLElement) {
    const row = [...(checks[r.id] ?? Array(r.steps.length).fill(false))];
    row[i] = !row[i];
    onCheck({ ...checks, [r.id]: row });
    if (row[i] && r.steps.every((_, j) => row[j])) heartBurst(el);
  }

  function saveRoutine(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name")).trim();
    const steps = String(f.get("steps")).split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 15);
    if (!name || !steps.length) return;
    onChangeRoutines(routines.map((r) => (r.id === id ? { ...r, name, steps } : r)));
  }

  return (
    <section className="card" style={{ gridArea: "routines" }} aria-labelledby="h-rout">
      <CardHeader id="h-rout" icon="heart" eyebrow="Self-care" title="Routines" />
      {routines.length === 0 && <p className="empty">No routines yet. Tap <b>Edit routines</b> to add one.</p>}

      {!editing && (
        <div className="routines">
          {routines.map((r) => {
            const row = checks[r.id] ?? [];
            const done = r.steps.filter((_, i) => row[i]).length;
            return (
              <div className="routine" key={r.id}>
                <div className="routine-h">
                  <b>{r.name}</b>
                  <span className={done === r.steps.length ? "all-done" : ""}>{done === r.steps.length ? "Done" : `${done} of ${r.steps.length}`}</span>
                </div>
                <ul className="ms-list">
                  {r.steps.map((s, i) => (
                    <li key={i} className={row[i] ? "done" : ""}>
                      <button type="button" className={`chk sm${row[i] ? " on" : ""}`} aria-pressed={!!row[i]} aria-label={`${s}, ${row[i] ? "done" : "not done"}`} onClick={(e) => tick(r, i, e.currentTarget)}>
                        <Icon name="check" strokeWidth={2.4} />
                      </button>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="routines">
          {routines.map((r) => (
            <form className="pform routine-edit" key={r.id} onSubmit={(e) => saveRoutine(e, r.id)} onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) e.currentTarget.requestSubmit();
            }}>
              <label className="full">Routine name<input id={`r-name-${r.id}`} name="name" defaultValue={r.name} maxLength={60} required /></label>
              <label className="full">Steps <small>(one per line)</small>
                <textarea id={`r-steps-${r.id}`} name="steps" defaultValue={r.steps.join("\n")} rows={Math.max(3, r.steps.length)} />
              </label>
              <div className="form-actions full">
                <button type="button" className={`btn ghost sm${confirmId === r.id ? " danger" : ""}`} onBlur={() => setConfirmId(null)}
                  onClick={() => {
                    if (confirmId !== r.id) return setConfirmId(r.id);
                    onChangeRoutines(routines.filter((x) => x.id !== r.id));
                  }}>
                  {confirmId === r.id ? "Tap again to delete" : "Delete routine"}
                </button>
              </div>
            </form>
          ))}
          {routines.length < 6 && (
            <button type="button" className="btn ghost sm" onClick={() => onChangeRoutines([...routines, { id: newId("r"), name: "New routine", steps: ["First step"] }])}>
              Add a routine
            </button>
          )}
        </div>
      )}

      <div className="card-foot">
        <button type="button" className="btn ghost sm" onClick={() => setEditing((v) => !v)}>{editing ? "Done editing" : "Edit routines"}</button>
      </div>
    </section>
  );
}
