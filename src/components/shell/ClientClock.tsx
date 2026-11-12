"use client";

import { useSyncExternalStore } from "react";
import { HomeScreen } from "../home/HomeScreen";
import { PlannerScreen } from "../planner/PlannerScreen";
import { CalendarScreen } from "../planner/CalendarScreen";
import { WellnessScreen } from "../wellness/WellnessScreen";
import { JournalScreen } from "../journal/JournalScreen";
import { MoneyScreen } from "../money/MoneyScreen";
import { BusinessScreen } from "../business/BusinessScreen";
import { HomeLifeScreen } from "../homelife/HomeLifeScreen";
import { SettingsScreen } from "../settings/SettingsScreen";
import { ContentScreen } from "../business/ContentScreen";
import { YearScreen } from "../year/YearScreen";

// Pages depend on your local date and time, so they render in the browser
// (never on the server) and refresh once a minute.

const SCREENS = { today: HomeScreen, planner: PlannerScreen, calendar: CalendarScreen, wellness: WellnessScreen, journal: JournalScreen,
  money: MoneyScreen, business: BusinessScreen, home: HomeLifeScreen, settings: SettingsScreen, content: ContentScreen, year: YearScreen };

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 15_000);
  return () => clearInterval(id);
}
const currentMinute = () => Math.floor(Date.now() / 60_000);
const serverMinute = () => null;

export function ClientClock({ screen }: { screen: keyof typeof SCREENS }) {
  const minute = useSyncExternalStore(subscribe, currentMinute, serverMinute);
  if (minute === null) {
    return (
      <div className="loading" role="status">
        <span className="s">My Pretty Little Life</span>
        <p>Getting your day ready…</p>
      </div>
    );
  }
  const Screen = SCREENS[screen];
  return <Screen now={new Date(minute * 60_000)} />;
}
