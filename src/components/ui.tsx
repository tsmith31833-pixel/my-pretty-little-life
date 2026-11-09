"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { MONTHS } from "@/lib/dates";

/** An × button that asks "Delete?" on the first tap and deletes on the second. */
export function DeleteButton({ label, onConfirm, text = "Delete?" }: { label: string; onConfirm: () => void; text?: string }) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      type="button"
      className={`iconbtn del${armed ? " confirm" : ""}`}
      aria-label={label}
      onBlur={() => setArmed(false)}
      onClick={() => {
        if (!armed) return setArmed(true);
        setArmed(false);
        onConfirm();
      }}
    >
      {armed ? text : <Icon name="x" />}
    </button>
  );
}

/** ‹ November 2026 › with a jump back to the current month. */
export function MonthNav({ month, current, onChange }: { month: Date; current: Date; onChange: (d: Date) => void }) {
  const isCurrent = month.getFullYear() === current.getFullYear() && month.getMonth() === current.getMonth();
  const shift = (n: number) => onChange(new Date(month.getFullYear(), month.getMonth() + n, 1));
  return (
    <div className="cal-ctrls">
      <button type="button" className="iconbtn round" aria-label="Previous month" onClick={() => shift(-1)}>‹</button>
      <span className="month-label">{MONTHS[month.getMonth()]} {month.getFullYear()}</span>
      <button type="button" className="iconbtn round" aria-label="Next month" onClick={() => shift(1)}>›</button>
      {!isCurrent && (
        <button type="button" className="btn ghost sm" onClick={() => onChange(new Date(current.getFullYear(), current.getMonth(), 1))}>This month</button>
      )}
    </div>
  );
}

/** Parses "$1,234.50" or "1234.5" into a number; returns null if it isn't a positive amount. */
export function parseMoney(v: FormDataEntryValue | string | null): number | null {
  const n = Number(String(v ?? "").replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

export function Progress({ value, max, tone }: { value: number; max: number; tone?: "gold" | "leaf" | "over" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <i className={tone ?? ""} style={{ width: `${pct}%` }} />
    </div>
  );
}
