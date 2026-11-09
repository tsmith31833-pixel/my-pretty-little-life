"use client";

import { useEffect, useState } from "react";
import { AppShell, useShell } from "../shell/AppShell";
import { WelcomeBanner } from "./WelcomeBanner";
import { Priorities } from "./Priorities";
import { Agenda, agendaLeft } from "./Agenda";
import { HabitTracker, habitsLeftToday } from "./HabitTracker";
import { UpcomingEvents } from "./UpcomingEvents";
import { FinancialSnapshot } from "./FinancialSnapshot";
import { BusinessSnapshot } from "./BusinessSnapshot";
import { WellnessTracker } from "./WellnessTracker";
import { DailyWins } from "./DailyWins";
import { usePlannerStore } from "@/lib/planner-store";
import { useSettings } from "@/lib/settings";
import { listEvents, type PlannerEvent } from "@/lib/data";
import { MONTHS, addDays, isoDate } from "@/lib/dates";

export function HomeScreen({ now }: { now: Date }) {
  return (
    <AppShell
      title="Today"
      crumb={`${MONTHS[now.getMonth()]} ${now.getDate()}`}
    >
      <HomeBody now={now} />
    </AppShell>
  );
}

function HomeBody({ now }: { now: Date }) {
  const { toast, version } = useShell();
  const saveError = () => toast("That change didn't save. Check your internet connection and try again.");
  const { status, day, week, todayIdx, updateDay, toggleHabit } = usePlannerStore(now, saveError);
  const { loaded, habits } = useSettings(saveError);

  // Events from the start of this month through the next 30 days (agenda, upcoming list, calendar dots).
  const today = isoDate(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const in30 = addDays(now, 30);
  const from = isoDate(monthStart);
  const to = isoDate(in30 > monthEnd ? in30 : monthEnd);
  const [events, setEvents] = useState<PlannerEvent[] | null>(null);
  const [eventsFailed, setEventsFailed] = useState(false);

  useEffect(() => {
    let live = true;
    listEvents(from, to)
      .then((rows) => live && (setEvents(rows), setEventsFailed(false)))
      .catch(() => live && setEventsFailed(true));
    return () => {
      live = false;
    };
  }, [from, to, version]);

  if (status !== "ready" || !loaded) {
    return (
      <div className="loading inline" role="status">
        <p>{status === "loading" ? "Getting your day ready…" : "Your planner couldn't load. Check your internet connection, then refresh the page."}</p>
      </div>
    );
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const todays = (events ?? []).filter((e) => e.day === today);
  const upcoming = (events ?? []).filter((e) => e.day > today && e.day <= isoDate(in30));
  const prioritiesLeft = day.priorities.filter((p) => !p.done).length;

  return (
    <>
      <WelcomeBanner
        now={now}
        eventsAhead={agendaLeft(todays, nowMinutes)}
        prioritiesLeft={prioritiesLeft}
        habitsLeft={habitsLeftToday(habits, week, todayIdx)}
        water={day.water}
      />

      <div className="dash">
        <Priorities priorities={day.priorities} onChange={(p) => updateDay((d) => ({ ...d, priorities: p }))} toast={toast} />
        <Agenda events={todays} loading={events === null && !eventsFailed} failed={eventsFailed} nowMinutes={nowMinutes} />
        <HabitTracker habits={habits} week={week} todayIdx={todayIdx} onToggle={toggleHabit} />
        <UpcomingEvents now={now} monthEvents={events ?? []} upcoming={upcoming} />
        <FinancialSnapshot now={now} />
        <BusinessSnapshot now={now} />
        <WellnessTracker
          sleepMinutes={day.sleep_minutes}
          steps={day.steps}
          water={day.water}
          mood={day.mood}
          onWater={(n) => updateDay((d) => ({ ...d, water: n }))}
          onMood={(m) => updateDay((d) => ({ ...d, mood: m }))}
          toast={toast}
        />
        <DailyWins wins={day.wins} onChange={(w) => updateDay((d) => ({ ...d, wins: w }))} toast={toast} />
      </div>
    </>
  );
}
