"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { AppShell, useShell } from "../shell/AppShell";
import { CardHeader } from "../home/CardHeader";
import { HabitTracker } from "../home/HabitTracker";
import { Glass, MOOD_ICONS, SLEEP_GOAL, STEP_GOAL } from "../home/WellnessTracker";
import { HabitHistory } from "./HabitHistory";
import { HabitEditor } from "./HabitEditor";
import { Routines } from "./Routines";
import { CycleCard } from "./CycleCard";
import { Trends } from "./Trends";
import { usePlannerStore } from "@/lib/planner-store";
import { useSettings } from "@/lib/settings";
import { MOODS } from "@/lib/sample-data";
import { MONTHS, WEEKDAYS } from "@/lib/dates";
import { heartBurst } from "@/lib/hearts";

export function WellnessScreen({ now }: { now: Date }) {
  return (
    <AppShell title="Wellness" crumb="Body & soul">
      <WellnessBody now={now} />
    </AppShell>
  );
}

function WellnessBody({ now }: { now: Date }) {
  const { toast } = useShell();
  const saveError = () => toast("That change didn't save. Check your internet connection and try again.");
  const { status, day, week, todayIdx, updateDay, toggleHabit } = usePlannerStore(now, saveError);
  const { loaded, habits, routines, updateHabits, updateRoutines } = useSettings(saveError);
  const [editingHabits, setEditingHabits] = useState(false);
  const [savedTick, setSavedTick] = useState(0);

  if (status !== "ready" || !loaded) {
    return (
      <div className="loading inline" role="status">
        <p>{status === "error" ? "Your wellness page couldn't load. Check your internet connection, then refresh." : "Getting your wellness ready…"}</p>
      </div>
    );
  }

  const sleepH = day.sleep_minutes === null ? "" : String(Math.floor(day.sleep_minutes / 60));
  const sleepM = day.sleep_minutes === null ? "" : String(day.sleep_minutes % 60);

  function saveSleep(form: HTMLFormElement) {
    const f = new FormData(form);
    const h = String(f.get("sleepH") ?? "");
    const m = String(f.get("sleepM") ?? "");
    const minutes = h === "" && m === "" ? null : Number(h || 0) * 60 + Number(m || 0);
    if (minutes === day.sleep_minutes) return;
    updateDay((d) => ({ ...d, sleep_minutes: minutes }));
    setSavedTick((t) => t + 1);
  }
  function saveSteps(value: string) {
    const steps = value.trim() === "" ? null : Math.max(0, Math.min(200000, Math.round(Number(value.replace(/[^\d]/g, "")))));
    if (steps === day.steps) return;
    updateDay((d) => ({ ...d, steps }));
    setSavedTick((t) => t + 1);
    if (steps !== null && steps >= STEP_GOAL) toast("Step goal reached. Look at you go!");
  }

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">{WEEKDAYS[now.getDay()]} · {MONTHS[now.getMonth()]} {now.getDate()}</span>
          <h2 className="page-title">Glow from within</h2>
        </div>
      </div>

      <div className="wgrid">
        <section className="card" style={{ gridArea: "check" }} aria-labelledby="h-check">
          <CardHeader id="h-check" icon="drop" eyebrow="Today" title="Daily check-in" meta={savedTick ? <span className="saved">Saved</span> : undefined} />
          <div className="well">
            <div className="wbox">
              <h3>Water <span>{day.water} of 8</span></h3>
              <div className="glasses">
                {Array.from({ length: 8 }, (_, i) => (
                  <button key={i} type="button" className="glass" aria-label={`Glass ${i + 1}${i < day.water ? ", filled" : ""}`}
                    onClick={(e) => {
                      const next = day.water === i + 1 ? i : i + 1;
                      updateDay((d) => ({ ...d, water: next }));
                      if (next === 8) heartBurst(e.currentTarget);
                    }}>
                    <Glass filled={i < day.water} />
                  </button>
                ))}
              </div>
            </div>
            <div className="wbox">
              <h3>Mood <span>{day.mood || "Not set"}</span></h3>
              <div className="moods">
                {MOODS.map((m, i) => (
                  <button key={m} type="button" className={`mood${day.mood === m ? " on" : ""}`} aria-pressed={day.mood === m}
                    onClick={(e) => { updateDay((d) => ({ ...d, mood: m })); heartBurst(e.currentTarget); }}>
                    <Icon name={MOOD_ICONS[i]} filled={day.mood === m} />{m}
                  </button>
                ))}
              </div>
            </div>
            <form className="wbox" onSubmit={(e) => { e.preventDefault(); saveSleep(e.currentTarget); }} onBlur={(e) => saveSleep(e.currentTarget)}>
              <h3>Sleep last night <span>goal {SLEEP_GOAL / 60}h</span></h3>
              <div className="num-pair">
                <label><input id="sleepH" name="sleepH" type="number" inputMode="numeric" min={0} max={24} defaultValue={sleepH} key={`h${sleepH}`} placeholder="7" /> hours</label>
                <label><input id="sleepM" name="sleepM" type="number" inputMode="numeric" min={0} max={59} step={5} defaultValue={sleepM} key={`m${sleepM}`} placeholder="30" /> min</label>
              </div>
              {day.sleep_minutes !== null && (
                <div className="bar"><i className="leaf" style={{ width: `${Math.min(100, Math.round((day.sleep_minutes / SLEEP_GOAL) * 100))}%` }} /></div>
              )}
            </form>
            <div className="wbox">
              <h3>Steps <span>goal {STEP_GOAL.toLocaleString("en-US")}</span></h3>
              <div className="num-pair">
                <label>
                  <input id="steps" name="steps" type="text" inputMode="numeric" defaultValue={day.steps ?? ""} key={`s${day.steps}`} placeholder="6500"
                    onBlur={(e) => saveSteps(e.currentTarget.value)} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} />
                  steps
                </label>
              </div>
              {day.steps !== null && <div className="bar"><i style={{ width: `${Math.min(100, Math.round((day.steps / STEP_GOAL) * 100))}%` }} /></div>}
              <p className="hint-sm">Copy today&apos;s number from the Health app on your iPhone.</p>
            </div>
          </div>
        </section>

        <div style={{ gridArea: "habits" }} className="stack">
          <HabitTracker
            habits={habits}
            week={week}
            todayIdx={todayIdx}
            onToggle={toggleHabit}
            gridArea="auto"
            footer={
              <div className="card-foot">
                <button type="button" className="btn ghost sm" onClick={() => setEditingHabits((v) => !v)}>
                  {editingHabits ? "Done editing" : "Edit habits"}
                </button>
              </div>
            }
          />
          {editingHabits && <HabitEditor habits={habits} onChange={updateHabits} />}
        </div>

        <HabitHistory now={now} habits={habits} />
        <Routines routines={routines} checks={day.routine_checks}
          onCheck={(checks) => updateDay((d) => ({ ...d, routine_checks: checks }))}
          onChangeRoutines={updateRoutines} />
        <CycleCard now={now} />
        <Trends now={now} todayWater={day.water} todayMood={day.mood} todaySleep={day.sleep_minutes} />
      </div>
    </>
  );
}
