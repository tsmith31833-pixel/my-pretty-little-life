"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { useShell } from "./AppShell";
import { EventForm } from "../planner/EventForm";
import { TodoForm } from "../planner/TodoForm";
import { isoDate } from "@/lib/dates";

// The pink "+" sheet: add an event or a to-do from any page.

export function QuickAdd({ onClose }: { onClose: () => void }) {
  const { toast, bump } = useShell();
  const [kind, setKind] = useState<"event" | "todo">("todo");

  function done(message: string) {
    bump();
    toast(message);
    onClose();
  }

  return (
    <div className="sheet-wrap" role="dialog" aria-modal="true" aria-labelledby="qa-title">
      <div className="scrim" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-h">
          <h2 id="qa-title">Quick add</h2>
          <button type="button" className="iconbtn" aria-label="Close" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="seg" role="tablist">
          <button type="button" role="tab" aria-selected={kind === "todo"} className={kind === "todo" ? "on" : ""} onClick={() => setKind("todo")}>To-do</button>
          <button type="button" role="tab" aria-selected={kind === "event"} className={kind === "event" ? "on" : ""} onClick={() => setKind("event")}>Event</button>
        </div>
        {kind === "todo" ? (
          <TodoForm onSaved={() => done("To-do added.")} />
        ) : (
          <EventForm day={isoDate(new Date())} onSaved={() => done("Event added to your calendar.")} />
        )}
      </div>
    </div>
  );
}
