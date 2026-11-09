"use client";

import { useState } from "react";
import { TODO_LISTS, addTodo } from "@/lib/data";

type Props = { onSaved: () => void; defaultList?: string; compact?: boolean };

export function TodoForm({ onSaved, defaultList = "Personal", compact = false }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const title = String(f.get("title")).trim();
    if (!title) {
      setError("Type the to-do first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await addTodo({ title, list: String(f.get("list")), due: String(f.get("due") || "") || null });
      form.reset();
      setBusy(false);
      onSaved();
    } catch {
      setError("The to-do didn't save. Check your internet connection and try again.");
      setBusy(false);
    }
  }

  const idp = compact ? "td-inline" : "td-quick";
  return (
    <form className={`pform${compact ? " compact" : ""}`} onSubmit={submit}>
      <label className="full">
        To-do
        <input id={`${idp}-title`} name="title" placeholder="Book lash appointment" maxLength={300} required autoFocus={!compact} />
      </label>
      <label>
        List
        <select id={`${idp}-list`} name="list" defaultValue={defaultList}>
          {TODO_LISTS.map((l) => <option key={l}>{l}</option>)}
        </select>
      </label>
      <label>
        Due <small>(optional)</small>
        <input id={`${idp}-due`} name="due" type="date" />
      </label>
      {error && <p className="auth-err full" role="alert">{error}</p>}
      <div className="form-actions full">
        <button type="submit" className="btn" disabled={busy}>{busy ? "Adding…" : "Add to-do"}</button>
      </div>
    </form>
  );
}
