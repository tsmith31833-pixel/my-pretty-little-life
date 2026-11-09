"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { newId } from "@/lib/settings";
import type { HabitDef } from "@/lib/data";

const MAX = 10;

export function HabitEditor({ habits, onChange }: { habits: HabitDef[]; onChange: (h: HabitDef[]) => void }) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const rename = (id: string, name: string) => {
    const n = name.trim();
    if (!n) return;
    onChange(habits.map((h) => (h.id === id ? { ...h, name: n } : h)));
  };
  const move = (i: number, dir: -1 | 1) => {
    const next = [...habits];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };

  return (
    <section className="card" aria-labelledby="h-hedit">
      <header className="card-h">
        <span className="badge"><Icon name="sparkle" /></span>
        <div><span className="eyebrow">Make it yours</span><h2 id="h-hedit">Edit habits</h2></div>
        <span className="meta"><b>{habits.length}</b>of {MAX}</span>
      </header>
      <p className="hint-sm">Rename a habit by typing over it. Removing a habit keeps its past check-ins saved but hides it.</p>
      <ul className="edit-list">
        {habits.map((h, i) => (
          <li key={h.id}>
            <label htmlFor={`habit-${h.id}`} className="sr-only">Habit name</label>
            <input id={`habit-${h.id}`} defaultValue={h.name} maxLength={60} onBlur={(e) => rename(h.id, e.currentTarget.value)}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} />
            <button type="button" className="iconbtn" disabled={i === 0} aria-label={`Move ${h.name} up`} onClick={() => move(i, -1)}>↑</button>
            <button type="button" className="iconbtn" disabled={i === habits.length - 1} aria-label={`Move ${h.name} down`} onClick={() => move(i, 1)}>↓</button>
            <button type="button" className={`iconbtn del${confirmId === h.id ? " confirm" : ""}`} aria-label={`Remove ${h.name}`}
              onBlur={() => setConfirmId(null)}
              onClick={() => {
                if (confirmId !== h.id) return setConfirmId(h.id);
                setConfirmId(null);
                onChange(habits.filter((x) => x.id !== h.id));
              }}>
              {confirmId === h.id ? "Remove?" : <Icon name="x" />}
            </button>
          </li>
        ))}
      </ul>
      {habits.length < MAX && (
        <form className="ms-add" onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem("newHabit") as HTMLInputElement;
          const v = input.value.trim();
          if (!v) return;
          input.value = "";
          onChange([...habits, { id: newId("h"), name: v }]);
        }}>
          <label htmlFor="newHabit" className="sr-only">New habit</label>
          <input id="newHabit" name="newHabit" placeholder="Add a habit, like Stretch 10 minutes" maxLength={60} />
          <button type="submit" className="iconbtn" aria-label="Add habit"><Icon name="plus" /></button>
        </form>
      )}
    </section>
  );
}
