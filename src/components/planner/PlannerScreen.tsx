"use client";

import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { Bow } from "../Ornaments";
import { AppShell, useShell } from "../shell/AppShell";
import { TodoForm } from "./TodoForm";
import { GoalsBoard } from "./GoalsBoard";
import { TODO_LISTS, deleteTodo, listTodos, setTodoDone, type Todo } from "@/lib/data";
import { MONTHS, WEEKDAYS, isoDate } from "@/lib/dates";
import { heartBurst } from "@/lib/hearts";

type Filter = "open" | "today" | "upcoming" | "done";
const FILTERS: [Filter, string][] = [["open", "All open"], ["today", "Today"], ["upcoming", "Upcoming"], ["done", "Done"]];

export function PlannerScreen({ now }: { now: Date }) {
  return (
    <AppShell title="Planner" crumb="To-dos & goals">
      <PlannerBody now={now} />
    </AppShell>
  );
}

function dueLabel(due: string, today: string) {
  if (due === today) return "Today";
  const d = new Date(`${due}T12:00:00`);
  const label = `${WEEKDAYS[d.getDay()].slice(0, 3)}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
  return due < today ? `Overdue · ${label}` : label;
}

function PlannerBody({ now }: { now: Date }) {
  const { toast, version } = useShell();
  const [tab, setTab] = useState<"todos" | "goals">("todos");
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const [filter, setFilter] = useState<Filter>("open");
  const [list, setList] = useState<string>("All lists");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const today = isoDate(now);

  useEffect(() => {
    let live = true;
    listTodos()
      .then((rows) => live && (setTodos(rows), setFailed(false)))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [version, reload]);

  const refresh = () => setReload((r) => r + 1);

  async function toggle(t: Todo, el: HTMLElement) {
    setTodos((rows) => rows?.map((r) => (r.id === t.id ? { ...r, done: !t.done } : r)) ?? null);
    if (!t.done) heartBurst(el);
    try {
      await setTodoDone(t.id, !t.done);
    } catch {
      toast("That change didn't save. Check your internet connection and try again.");
      refresh();
    }
  }

  async function remove(t: Todo) {
    if (confirmId !== t.id) {
      setConfirmId(t.id);
      return;
    }
    setConfirmId(null);
    setTodos((rows) => rows?.filter((r) => r.id !== t.id) ?? null);
    try {
      await deleteTodo(t.id);
      toast("To-do deleted.");
    } catch {
      toast("The to-do wasn't deleted. Check your internet connection and try again.");
      refresh();
    }
  }

  const shown = (todos ?? []).filter((t) => {
    if (list !== "All lists" && t.list !== list) return false;
    if (filter === "done") return t.done;
    if (t.done) return false;
    if (filter === "today") return !!t.due && t.due <= today;
    if (filter === "upcoming") return !!t.due && t.due > today;
    return true;
  });
  const openCount = (todos ?? []).filter((t) => !t.done).length;
  const dueToday = (todos ?? []).filter((t) => !t.done && t.due && t.due <= today).length;

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">{WEEKDAYS[now.getDay()]} · {MONTHS[now.getMonth()]} {now.getDate()}</span>
          <h2 className="page-title">Plan it pretty</h2>
        </div>
        <div className="seg big" role="tablist" aria-label="Planner sections">
          <button type="button" role="tab" aria-selected={tab === "todos"} className={tab === "todos" ? "on" : ""} onClick={() => setTab("todos")}>To-dos</button>
          <button type="button" role="tab" aria-selected={tab === "goals"} className={tab === "goals" ? "on" : ""} onClick={() => setTab("goals")}>Goals</button>
        </div>
      </div>

      {tab === "goals" ? (
        <GoalsBoard now={now} />
      ) : (
        <div className="split">
          <section className="card" aria-labelledby="h-todos">
            <header className="card-h">
              <span className="badge"><Icon name="check" /></span>
              <div><span className="eyebrow">Get it done</span><h2 id="h-todos">To-do list</h2></div>
              <span className="meta"><b>{openCount}</b>open{dueToday ? ` · ${dueToday} due` : ""}</span>
            </header>

            <div className="chipset-row" role="group" aria-label="Show">
              {FILTERS.map(([k, label]) => (
                <button key={k} type="button" className={`fchip${filter === k ? " on" : ""}`} aria-pressed={filter === k} onClick={() => setFilter(k)}>{label}</button>
              ))}
            </div>
            <div className="chipset-row" role="group" aria-label="List">
              {["All lists", ...TODO_LISTS].map((l) => (
                <button key={l} type="button" className={`fchip soft${list === l ? " on" : ""}`} aria-pressed={list === l} onClick={() => setList(l)}>{l}</button>
              ))}
            </div>

            {failed && <p className="auth-err">Your to-dos couldn&apos;t load. Check your internet connection, then refresh. If this is your first time here, run <b>supabase/phase2.sql</b> in Supabase.</p>}
            {!failed && todos === null && <p className="empty">Loading your to-dos…</p>}
            {todos !== null && shown.length === 0 && (
              <p className="empty">{filter === "done" ? "Nothing ticked off yet. You've got this." : "Nothing here. Add a to-do and it will appear in this list."}</p>
            )}

            <ul className="todo-list">
              {shown.map((t) => (
                <li key={t.id} className={`todo-row${t.done ? " done" : ""}`}>
                  <button type="button" className={`chk${t.done ? " on" : ""}`} aria-pressed={t.done} aria-label={`Mark "${t.title}" ${t.done ? "not done" : "done"}`} onClick={(e) => toggle(t, e.currentTarget)}>
                    <Icon name="check" strokeWidth={2.4} />
                  </button>
                  <div className="todo-main">
                    <span className="todo-title">{t.title}</span>
                    <span className="todo-meta">
                      <span className="tag-pill">{t.list}</span>
                      {t.due && <span className={!t.done && t.due < today ? "overdue" : ""}>{dueLabel(t.due, today)}</span>}
                    </span>
                  </div>
                  <button type="button" className={`iconbtn del${confirmId === t.id ? " confirm" : ""}`} onClick={() => remove(t)} onBlur={() => setConfirmId(null)} aria-label={`Delete "${t.title}"`}>
                    {confirmId === t.id ? "Delete?" : <Icon name="x" />}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="card add-card" aria-labelledby="h-add-todo">
            <Bow className="orn" style={{ width: 60, right: 18, top: -18 }} />
            <header className="card-h">
              <span className="badge"><Icon name="plus" /></span>
              <div><span className="eyebrow">New</span><h2 id="h-add-todo">Add a to-do</h2></div>
            </header>
            <TodoForm compact defaultList={list === "All lists" ? "Personal" : list} onSaved={() => { toast("To-do added."); refresh(); }} />
          </section>
        </div>
      )}
    </>
  );
}
