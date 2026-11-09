"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { AppShell, useShell } from "../shell/AppShell";
import { CardHeader } from "../home/CardHeader";
import { DeleteButton } from "../ui";
import {
  AISLES, MEALS, addChore, addGrocery, clearDoneGroceries, deleteChore, deleteGrocery, getMeals, listChores, listGroceries,
  markChoreDone, saveMeals, setGroceryDone, useRows, type Chore, type MealWeek,
} from "@/lib/money";
import { MONTHS, WEEKDAYS, addDays, isoDate } from "@/lib/dates";
import { heartBurst } from "@/lib/hearts";

export function HomeLifeScreen({ now }: { now: Date }) {
  return (
    <AppShell title="Home" crumb="Meals, groceries & cleaning">
      <HomeLifeBody now={now} />
    </AppShell>
  );
}

const FREQUENCIES: [number, string][] = [[1, "Every day"], [3, "Every 3 days"], [7, "Every week"], [14, "Every 2 weeks"], [30, "Every month"], [90, "Every 3 months"]];
const freqLabel = (n: number) => FREQUENCIES.find(([d]) => d === n)?.[1] ?? `Every ${n} days`;
const ROOMS = ["Kitchen", "Bathroom", "Bedroom", "Living room", "Laundry", "Whole home", "Outdoors"];
const STARTER_CHORES: Omit<Chore, "id">[] = [
  { name: "Wipe kitchen counters", room: "Kitchen", every_days: 1, last_done: null },
  { name: "Run the dishwasher", room: "Kitchen", every_days: 1, last_done: null },
  { name: "Clean bathroom sink & mirror", room: "Bathroom", every_days: 7, last_done: null },
  { name: "Change bed sheets", room: "Bedroom", every_days: 7, last_done: null },
  { name: "Vacuum & mop floors", room: "Whole home", every_days: 7, last_done: null },
  { name: "Laundry", room: "Laundry", every_days: 7, last_done: null },
  { name: "Clean out the fridge", room: "Kitchen", every_days: 14, last_done: null },
  { name: "Deep clean the shower", room: "Bathroom", every_days: 14, last_done: null },
  { name: "Dust shelves & surfaces", room: "Whole home", every_days: 14, last_done: null },
  { name: "Wash makeup brushes", room: "Bathroom", every_days: 14, last_done: null },
];

const between = (a: string, b: string) => Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 864e5);

function HomeLifeBody({ now }: { now: Date }) {
  const { toast } = useShell();
  const today = isoDate(now);
  async function run(fn: () => Promise<void>, ok: string, after: () => void) {
    try {
      await fn();
      if (ok) toast(ok);
    } catch {
      toast("That didn't save. Check your internet connection and try again.");
    }
    after();
  }

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">{WEEKDAYS[now.getDay()]} · {MONTHS[now.getMonth()]} {now.getDate()}</span>
          <h2 className="page-title">Home sweet home</h2>
        </div>
      </div>
      <MealPlan now={now} run={run} />
      <div className="split">
        <Chores today={today} run={run} />
        <Groceries run={run} />
      </div>
    </>
  );
}

type Run = (fn: () => Promise<void>, ok: string, after: () => void) => Promise<void>;

function MealPlan({ now, run }: { now: Date; run: Run }) {
  const [weekStart, setWeekStart] = useState(addDays(now, -now.getDay()));
  const wk = isoDate(weekStart);
  const meals = useRows(() => getMeals(wk), [wk]);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const plan: MealWeek = meals.data ?? {};

  function setMeal(dayIdx: number, meal: (typeof MEALS)[number], value: string) {
    const v = value.trim();
    if ((plan[dayIdx]?.[meal] ?? "") === v) return;
    const next: MealWeek = { ...plan, [dayIdx]: { ...plan[dayIdx], [meal]: v } };
    meals.setData(next);
    run(() => saveMeals(wk, next), "", () => {});
  }

  const label = `${MONTHS[days[0].getMonth()].slice(0, 3)} ${days[0].getDate()} – ${MONTHS[days[6].getMonth()].slice(0, 3)} ${days[6].getDate()}`;
  return (
    <section className="card" aria-labelledby="h-meals">
      <header className="card-h">
        <span className="badge"><Icon name="cherry" /></span>
        <div><span className="eyebrow">This week</span><h2 id="h-meals">Meal plan</h2></div>
        <div className="cal-ctrls meta-ctrls">
          <button type="button" className="iconbtn round" aria-label="Previous week" onClick={() => setWeekStart(addDays(weekStart, -7))}>‹</button>
          <span className="month-label sm">{label}</span>
          <button type="button" className="iconbtn round" aria-label="Next week" onClick={() => setWeekStart(addDays(weekStart, 7))}>›</button>
        </div>
      </header>
      {meals.failed && <p className="auth-err">Your meal plan couldn&apos;t load. If this is your first time here, run <b>supabase/phase4.sql</b> in Supabase.</p>}
      {meals.data && (
        <div className="meal-grid">
          {days.map((d, i) => (
            <div className={`meal-day${isoDate(d) === isoDate(now) ? " today" : ""}`} key={`${wk}-${i}`}>
              <h3>{WEEKDAYS[d.getDay()].slice(0, 3)} <span>{d.getDate()}</span></h3>
              {MEALS.map((m) => (
                <label key={m}>
                  <span>{m}</span>
                  <input id={`meal-${i}-${m}`} defaultValue={plan[i]?.[m] ?? ""} placeholder="—" maxLength={80}
                    onBlur={(e) => setMeal(i, m, e.currentTarget.value)} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} />
                </label>
              ))}
            </div>
          ))}
        </div>
      )}
      <p className="hint-sm">Type a meal and tap away to save. Add the ingredients to your grocery list below.</p>
    </section>
  );
}

function Groceries({ run }: { run: Run }) {
  const items = useRows(listGroceries, []);
  const list = items.data ?? [];
  const open = list.filter((g) => !g.done);
  const done = list.filter((g) => g.done);
  const aisles = AISLES.filter((a) => open.some((g) => g.aisle === a));

  function toggle(id: string, value: boolean, el: HTMLElement) {
    items.setData(list.map((g) => (g.id === id ? { ...g, done: value } : g)));
    if (value) heartBurst(el);
    run(() => setGroceryDone(id, value), "", () => {});
  }

  return (
    <section className="card" aria-labelledby="h-groc">
      <CardHeader id="h-groc" icon="plus" eyebrow="Shopping" title="Grocery list" meta={<><b>{open.length}</b>to buy</>} />
      <form className="ms-add" onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        const name = String(f.get("name")).trim();
        if (!name) return;
        run(() => addGrocery({ name, aisle: String(f.get("aisle")) }), "", () => { (form.elements.namedItem("name") as HTMLInputElement).value = ""; items.reload(); });
      }}>
        <label htmlFor="groc-name" className="sr-only">Item</label>
        <input id="groc-name" name="name" placeholder="Strawberries" maxLength={80} required />
        <label htmlFor="groc-aisle" className="sr-only">Aisle</label>
        <select id="groc-aisle" name="aisle" className="aisle-sel">{AISLES.map((a) => <option key={a}>{a}</option>)}</select>
        <button type="submit" className="iconbtn" aria-label="Add item"><Icon name="plus" /></button>
      </form>
      {items.failed && <p className="auth-err">Your grocery list couldn&apos;t load. Check your internet connection, then refresh.</p>}
      {items.data && list.length === 0 && <p className="empty">Your list is empty. Add what you need and tick items off in the store.</p>}
      {aisles.map((a) => (
        <div className="aisle" key={a}>
          <h3>{a}</h3>
          <ul className="ms-list">
            {open.filter((g) => g.aisle === a).map((g) => (
              <li key={g.id}>
                <button type="button" className="chk sm" aria-pressed={false} aria-label={`Got ${g.name}`} onClick={(e) => toggle(g.id, true, e.currentTarget)}>
                  <Icon name="check" strokeWidth={2.4} />
                </button>
                <span>{g.name}</span>
                <button type="button" className="iconbtn tiny" aria-label={`Remove ${g.name}`} onClick={() => run(() => deleteGrocery(g.id), "", items.reload)}><Icon name="x" /></button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {done.length > 0 && (
        <div className="aisle">
          <h3>In the cart</h3>
          <ul className="ms-list">
            {done.map((g) => (
              <li key={g.id} className="done">
                <button type="button" className="chk sm on" aria-pressed={true} aria-label={`Put ${g.name} back on the list`} onClick={(e) => toggle(g.id, false, e.currentTarget)}>
                  <Icon name="check" strokeWidth={2.4} />
                </button>
                <span>{g.name}</span>
              </li>
            ))}
          </ul>
          <div className="card-foot">
            <button type="button" className="btn ghost sm" onClick={() => run(clearDoneGroceries, "Cleared the cart.", items.reload)}>Clear {done.length} ticked {done.length === 1 ? "item" : "items"}</button>
          </div>
        </div>
      )}
    </section>
  );
}

function Chores({ today, run }: { today: string; run: Run }) {
  const chores = useRows(listChores, []);
  const [adding, setAdding] = useState(false);
  const list = chores.data ?? [];
  const withDue = list
    .map((c) => {
      const dueIn = c.last_done ? c.every_days - between(c.last_done, today) : -1;
      return { ...c, dueIn };
    })
    .sort((a, b) => a.dueIn - b.dueIn);
  const dueNow = withDue.filter((c) => c.dueIn <= 0).length;

  return (
    <section className="card" aria-labelledby="h-chores">
      <CardHeader id="h-chores" icon="home" eyebrow="Keep it pretty" title="Cleaning schedule" meta={<><b>{dueNow}</b>due now</>} />
      {chores.failed && <p className="auth-err">Your cleaning schedule couldn&apos;t load. Check your internet connection, then refresh.</p>}
      {chores.data && list.length === 0 && (
        <div className="empty-start">
          <p className="empty">No chores yet. Start with a ready-made list and adjust it, or add your own.</p>
          <button type="button" className="btn" onClick={async () => {
            for (const c of STARTER_CHORES) await addChore(c).catch(() => {});
            chores.reload();
          }}>Add starter chores</button>
        </div>
      )}
      <ul className="txn-list">
        {withDue.map((c) => {
          const status = !c.last_done ? "Not done yet" : c.dueIn < 0 ? `Overdue by ${-c.dueIn} ${c.dueIn === -1 ? "day" : "days"}` : c.dueIn === 0 ? "Due today" : `Due in ${c.dueIn} ${c.dueIn === 1 ? "day" : "days"}`;
          const doneToday = c.last_done === today;
          return (
            <li key={c.id} className={doneToday ? "done" : ""}>
              <button type="button" className={`chk${doneToday ? " on" : ""}`} aria-pressed={doneToday} aria-label={doneToday ? `Undo ${c.name}` : `Mark ${c.name} done today`}
                onClick={(e) => {
                  const value = doneToday ? null : today;
                  chores.setData(list.map((x) => (x.id === c.id ? { ...x, last_done: value } : x)));
                  if (!doneToday) heartBurst(e.currentTarget);
                  run(() => markChoreDone(c.id, value), "", () => {});
                }}>
                <Icon name="check" strokeWidth={2.4} />
              </button>
              <div className="todo-main">
                <span className="todo-title">{c.name}</span>
                <span className="todo-meta">
                  <span className="tag-pill">{c.room}</span>
                  <span className={!doneToday && c.dueIn < 0 && c.last_done ? "overdue" : ""}>{doneToday ? "Done today" : status}</span>
                  <span>{freqLabel(c.every_days)}</span>
                </span>
              </div>
              <DeleteButton label={`Delete chore ${c.name}`} onConfirm={() => run(() => deleteChore(c.id), "Chore removed.", chores.reload)} />
            </li>
          );
        })}
      </ul>
      {adding ? (
        <form className="pform" onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          run(() => addChore({ name: String(f.get("name")).trim(), room: String(f.get("room")), every_days: Number(f.get("every")), last_done: null }), "Chore added.", () => { setAdding(false); chores.reload(); });
        }}>
          <label className="full">Chore<input id="chore-name" name="name" placeholder="Water the plants" maxLength={80} required autoFocus /></label>
          <label>Room<select id="chore-room" name="room">{ROOMS.map((r) => <option key={r}>{r}</option>)}</select></label>
          <label>How often<select id="chore-every" name="every" defaultValue={7}>{FREQUENCIES.map(([d, l]) => <option key={d} value={d}>{l}</option>)}</select></label>
          <div className="form-actions full"><button type="button" className="btn ghost" onClick={() => setAdding(false)}>Cancel</button><button type="submit" className="btn">Add chore</button></div>
        </form>
      ) : (
        <div className="card-foot"><button type="button" className="btn ghost sm" onClick={() => setAdding(true)}>Add a chore</button></div>
      )}
    </section>
  );
}
