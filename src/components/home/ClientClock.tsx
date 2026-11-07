"use client";

import { useSyncExternalStore } from "react";
import { HomeScreen } from "./HomeScreen";

// The home screen depends on your local date and time, so it renders in the
// browser (never on the server) and refreshes once a minute.

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 15_000);
  return () => clearInterval(id);
}
const currentMinute = () => Math.floor(Date.now() / 60_000);
const serverMinute = () => null;

export function ClientClock() {
  const minute = useSyncExternalStore(subscribe, currentMinute, serverMinute);
  if (minute === null) {
    return (
      <div className="loading" role="status">
        <span className="s">My Pretty Little Life</span>
        <p>Getting your day ready…</p>
      </div>
    );
  }
  return <HomeScreen now={new Date(minute * 60_000)} />;
}
