"use client";

import { useState } from "react";
import { EVENT_TAGS, saveEvent, type PlannerEvent } from "@/lib/data";

const LENGTHS = [15, 30, 45, 60, 90, 120, 180, 240];

const toTime = (m: number | null) =>
  m === null ? "" : `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const lengthLabel = (m: number) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} h`);

type Props = { day: string; existing?: PlannerEvent; onSaved: () => void; onCancel?: () => void };

export function EventForm({ day, existing, onSaved, onCancel }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const id = existing?.id ?? "new";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const title = String(f.get("title")).trim();
    if (!title) {
      setError("Give the event a name.");
      return;
    }
    const time = String(f.get("time") || "");
    const [h, m] = time.split(":").map(Number);
    setBusy(true);
    setError("");
    try {
      await saveEvent(
        {
          title,
          day: String(f.get("day")),
          start_min: time ? h * 60 + m : null,
          minutes: Number(f.get("minutes")),
          tag: String(f.get("tag")),
          notes: String(f.get("notes") || "").trim() || null,
        },
        existing?.id,
      );
      onSaved();
    } catch {
      setError("The event didn't save. Check your internet connection and try again.");
      setBusy(false);
    }
  }

  return (
    <form className="pform" onSubmit={submit}>
      <label className="full">
        Event
        <input id={`ev-title-${id}`} name="title" defaultValue={existing?.title} placeholder="Brunch with the girls" maxLength={200} required autoFocus />
      </label>
      <label>
        Date
        <input id={`ev-day-${id}`} name="day" type="date" defaultValue={existing?.day ?? day} required />
      </label>
      <label>
        Time <small>(empty = all day)</small>
        <input id={`ev-time-${id}`} name="time" type="time" defaultValue={toTime(existing?.start_min ?? null)} />
      </label>
      <label>
        Length
        <select id={`ev-len-${id}`} name="minutes" defaultValue={existing?.minutes ?? 60}>
          {LENGTHS.map((m) => <option key={m} value={m}>{lengthLabel(m)}</option>)}
        </select>
      </label>
      <label>
        Type
        <select id={`ev-tag-${id}`} name="tag" defaultValue={existing?.tag ?? "Me time"}>
          {EVENT_TAGS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </label>
      <label className="full">
        Notes <small>(optional)</small>
        <input id={`ev-notes-${id}`} name="notes" defaultValue={existing?.notes ?? ""} placeholder="Address, what to bring…" maxLength={500} />
      </label>
      {error && <p className="auth-err full" role="alert">{error}</p>}
      <div className="form-actions full">
        {onCancel && <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn" disabled={busy}>{busy ? "Saving…" : existing ? "Save changes" : "Add event"}</button>
      </div>
    </form>
  );
}
