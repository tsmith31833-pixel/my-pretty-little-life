"use client";

import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { useShell } from "../shell/AppShell";
import { GOAL_AREAS, addGoal, deleteGoal, listGoals, updateMilestones, type Goal } from "@/lib/data";
import { MONTHS } from "@/lib/dates";
import { heartBurst } from "@/lib/hearts";

function targetLabel(target: string) {
  const d = new Date(`${target}T12:00:00`);
  return `By ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function GoalsBoard({ now }: { now: Date }) {
  const { toast } = useShell();
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    listGoals()
      .then((rows) => live && (setGoals(rows), setFailed(false)))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [reload]);

  const refresh = () => setReload((r) => r + 1);
  const oops = () => {
    toast("That change didn't save. Check your internet connection and try again.");
    refresh();
  };

  async function saveMilestones(g: Goal, milestones: Goal["milestones"]) {
    setGoals((rows) => rows?.map((r) => (r.id === g.id ? { ...r, milestones } : r)) ?? null);
    try {
      await updateMilestones(g.id, milestones);
    } catch {
      oops();
    }
  }

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const title = String(f.get("title")).trim();
    if (!title) return;
    try {
      await addGoal({
        title,
        area: String(f.get("area")),
        target: String(f.get("target") || "") || null,
        why: String(f.get("why") || "").trim() || null,
        milestones: [],
      });
      setAdding(false);
      toast("Goal added. Now break it into small steps.");
      refresh();
    } catch {
      toast("The goal didn't save. Check your internet connection and try again.");
    }
  }

  async function remove(g: Goal) {
    if (confirmId !== g.id) {
      setConfirmId(g.id);
      return;
    }
    setConfirmId(null);
    setGoals((rows) => rows?.filter((r) => r.id !== g.id) ?? null);
    try {
      await deleteGoal(g.id);
      toast("Goal deleted.");
    } catch {
      oops();
    }
  }

  return (
    <div className="goals">
      <div className="goals-bar">
        <p className="lede-sm">{goals ? `${goals.length} ${goals.length === 1 ? "goal" : "goals"} for ${now.getFullYear()} and beyond` : ""}</p>
        <button type="button" className="btn" onClick={() => setAdding((a) => !a)}>{adding ? "Close" : "New goal"}</button>
      </div>

      {adding && (
        <section className="card" aria-label="New goal">
          <form className="pform" onSubmit={create}>
            <label className="full">Goal<input id="goal-title" name="title" placeholder="Pay off my credit card" maxLength={200} required autoFocus /></label>
            <label>Area<select id="goal-area" name="area">{GOAL_AREAS.map((a) => <option key={a}>{a}</option>)}</select></label>
            <label>Target date <small>(optional)</small><input id="goal-target" name="target" type="date" /></label>
            <label className="full">Why it matters <small>(optional)</small><input id="goal-why" name="why" placeholder="So I can travel debt-free" maxLength={300} /></label>
            <div className="form-actions full"><button type="submit" className="btn">Add goal</button></div>
          </form>
        </section>
      )}

      {failed && <p className="auth-err">Your goals couldn&apos;t load. Check your internet connection, then refresh.</p>}
      {goals?.length === 0 && !adding && (
        <section className="card empty-card">
          <p className="empty">No goals yet. Tap <b>New goal</b>, then add the small steps that get you there.</p>
        </section>
      )}

      <div className="goal-grid">
        {goals?.map((g) => {
          const total = g.milestones.length;
          const done = g.milestones.filter((m) => m.done).length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <section className="card goal-card" key={g.id} aria-label={g.title}>
              <div className="goal-top">
                <span className="tag-pill">{g.area}</span>
                <button type="button" className={`iconbtn del${confirmId === g.id ? " confirm" : ""}`} onClick={() => remove(g)} onBlur={() => setConfirmId(null)} aria-label={`Delete goal "${g.title}"`}>
                  {confirmId === g.id ? "Delete?" : <Icon name="x" />}
                </button>
              </div>
              <h3 className="goal-title">{g.title}</h3>
              {g.why && <p className="goal-why">“{g.why}”</p>}
              {g.target && <p className="goal-target">{targetLabel(g.target)}</p>}
              <div className="goal-prog">
                <div className="bar"><i className={pct === 100 ? "gold" : ""} style={{ width: `${pct}%` }} /></div>
                <span>{total ? `${done} of ${total} ${total === 1 ? "step" : "steps"} · ${pct}%` : "No steps yet"}</span>
              </div>
              <ul className="ms-list">
                {g.milestones.map((m, i) => (
                  <li key={i} className={m.done ? "done" : ""}>
                    <button type="button" className={`chk sm${m.done ? " on" : ""}`} aria-pressed={m.done} aria-label={`Mark step "${m.title}" ${m.done ? "not done" : "done"}`}
                      onClick={(e) => {
                        if (!m.done) heartBurst(e.currentTarget);
                        saveMilestones(g, g.milestones.map((x, j) => (j === i ? { ...x, done: !x.done } : x)));
                      }}>
                      <Icon name="check" strokeWidth={2.4} />
                    </button>
                    <span>{m.title}</span>
                    <button type="button" className="iconbtn tiny" aria-label={`Remove step "${m.title}"`} onClick={() => saveMilestones(g, g.milestones.filter((_, j) => j !== i))}>
                      <Icon name="x" />
                    </button>
                  </li>
                ))}
              </ul>
              <form className="ms-add" onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.namedItem("step") as HTMLInputElement;
                const v = input.value.trim();
                if (!v) return;
                input.value = "";
                saveMilestones(g, [...g.milestones, { title: v, done: false }]);
              }}>
                <label htmlFor={`step-${g.id}`} className="sr-only">New step</label>
                <input id={`step-${g.id}`} name="step" placeholder="Add a step…" maxLength={200} />
                <button type="submit" className="iconbtn" aria-label="Add step"><Icon name="plus" /></button>
              </form>
            </section>
          );
        })}
      </div>
    </div>
  );
}
