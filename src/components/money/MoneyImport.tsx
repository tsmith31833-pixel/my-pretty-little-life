"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { parseMoney } from "../ui";
import { addBill, addDebt, usd, type Bill, type Debt } from "@/lib/money";
import { parseMoneySheet, type ParsedMoney, type SheetIn } from "@/lib/money-import";

// "Import from spreadsheet" on Personal finance: read the Money tab, let you fill gaps, then add.

type DebtDraft = { key: string; include: boolean; exists: boolean; name: string; balance: string; start: string; apr: string; min: string };
type BillDraft = { key: string; include: boolean; exists: boolean; kind: string; name: string; amount: string; due: string; autopay: boolean };

const s = (n: number | null) => (n == null ? "" : String(n));
const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, "");
const dueOk = (v: string) => /^\d{1,2}$/.test(v.trim()) && Number(v) >= 1 && Number(v) <= 31;

type Props = { debts: Debt[]; bills: Bill[]; toast: (m: string) => void; onDone: () => void };

export function MoneyImportButton(props: Props) {
  const { toast } = props;
  const [parsed, setParsed] = useState<{ p: ParsedMoney; file: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function read(file: File) {
    setBusy(true);
    try {
      const { default: readXlsxFile } = await import("read-excel-file/browser");
      const p = parseMoneySheet((await readXlsxFile(file)) as unknown as SheetIn[]);
      if (!p.debts.length && !p.bills.length) toast(p.notes[0] ?? "No debts or bills were found in that file.");
      else setParsed({ p, file: file.name });
    } catch {
      toast("That file couldn't be read. Save it as an Excel .xlsx file and try again.");
    }
    setBusy(false);
  }

  return (
    <>
      <label className="btn ghost sm file-btn">
        <Icon name="plus" strokeWidth={2.2} /> {busy ? "Reading…" : "Import from spreadsheet"}
        <input type="file" className="sr-only" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={busy}
          onChange={(e) => { const f = e.currentTarget.files?.[0]; e.currentTarget.value = ""; if (f) read(f); }} />
      </label>
      {parsed && <Review {...props} parsed={parsed.p} file={parsed.file} onClose={() => setParsed(null)} />}
    </>
  );
}

function Review({ parsed, file, debts, bills, toast, onDone, onClose }: Props & { parsed: ParsedMoney; file: string; onClose: () => void }) {
  const haveDebt = new Set(debts.map((d) => norm(d.name)));
  const haveBill = new Set(bills.map((b) => norm(b.name)));
  const [ds, setDs] = useState<DebtDraft[]>(() => parsed.debts.map((d, i) => ({
    key: `d${i}`, exists: haveDebt.has(norm(d.name)), include: !haveDebt.has(norm(d.name)),
    name: d.name, balance: s(d.balance ?? d.start), start: s(d.start), apr: s(d.apr), min: s(d.min),
  })));
  const [bs, setBs] = useState<BillDraft[]>(() => parsed.bills.map((b, i) => ({
    key: `b${i}`, exists: haveBill.has(norm(b.name)), include: !haveBill.has(norm(b.name)),
    kind: b.kind, name: b.name, amount: s(b.amount), due: s(b.dueDay), autopay: b.autopay,
  })));
  const [busy, setBusy] = useState(false);

  const debtReady = (d: DebtDraft) => d.include && !d.exists && parseMoney(d.balance || "") != null;
  const billReady = (b: BillDraft) => b.include && !b.exists && parseMoney(b.amount || "") != null && dueOk(b.due);
  const readyCount = ds.filter(debtReady).length + bs.filter(billReady).length;
  const setD = (k: string, patch: Partial<DebtDraft>) => setDs(ds.map((d) => (d.key === k ? { ...d, ...patch } : d)));
  const setB = (k: string, patch: Partial<BillDraft>) => setBs(bs.map((b) => (b.key === k ? { ...b, ...patch } : b)));

  async function run() {
    setBusy(true);
    let addedD = 0, addedB = 0, failed = 0;
    for (const d of ds.filter(debtReady)) {
      const balance = parseMoney(d.balance)!;
      const start = parseMoney(d.start) ?? balance;
      const apr = d.apr.trim() ? Number(d.apr.replace(/%/g, "")) : null;
      try {
        await addDebt({ name: d.name.trim(), start_balance: Math.max(start, balance), balance, apr: Number.isFinite(apr) ? apr : null, min_payment: parseMoney(d.min) });
        addedD++;
      } catch { failed++; }
    }
    for (const b of bs.filter(billReady)) {
      try {
        await addBill({ name: b.name.trim(), amount: parseMoney(b.amount)!, due_day: Number(b.due), autopay: b.autopay });
        addedB++;
      } catch { failed++; }
    }
    setBusy(false);
    const waiting = ds.filter((d) => d.include && !d.exists && !debtReady(d)).length + bs.filter((b) => b.include && !b.exists && !billReady(b)).length;
    toast(`Added ${addedD} ${addedD === 1 ? "debt" : "debts"} and ${addedB} ${addedB === 1 ? "bill" : "bills"}.${waiting ? ` ${waiting} still need numbers; import the file again when you have them.` : ""}${failed ? ` ${failed} didn't save.` : ""}`);
    onDone();
    onClose();
  }

  return (
    <div className="sheet-wrap" role="dialog" aria-modal="true" aria-labelledby="mi-title">
      <div className="scrim" onClick={onClose} />
      <div className="sheet wide mi-sheet">
        <div className="sheet-h">
          <h2 id="mi-title">Import money</h2>
          <button type="button" className="iconbtn" aria-label="Close" onClick={onClose}><Icon name="x" /></button>
        </div>
        <p className="lede-sm">From <b>{file}</b>. Fill in anything missing. Rows without a balance (debts) or an amount and due day (bills) are skipped for now.</p>
        {parsed.notes.map((n) => <p key={n} className="plan-ignore">{n}</p>)}

        {ds.length > 0 && (
          <section aria-labelledby="mi-debts" className="mi-section">
            <h3 id="mi-debts" className="arc-h">Debts ({ds.filter(debtReady).length} of {ds.length} ready)</h3>
            {ds.map((d) => (
              <div key={d.key} className={`mi-row${d.exists ? " exists" : ""}`}>
                <label className="mi-check">
                  <input type="checkbox" checked={d.include && !d.exists} disabled={d.exists} onChange={(e) => setD(d.key, { include: e.currentTarget.checked })} />
                  <b>{d.name}</b>
                  {d.exists ? <span className="tag-pill">Already added</span> : d.include && !debtReady(d) ? <span className="overdue small">Needs a balance</span> : null}
                </label>
                {!d.exists && (
                  <div className="mi-fields">
                    <label>Balance now<input id={`mi-bal-${d.key}`} inputMode="decimal" value={d.balance} placeholder="—" onChange={(e) => setD(d.key, { balance: e.currentTarget.value })} /></label>
                    <label>Starting balance<input id={`mi-start-${d.key}`} inputMode="decimal" value={d.start} placeholder="same" onChange={(e) => setD(d.key, { start: e.currentTarget.value })} /></label>
                    <label>APR %<input id={`mi-apr-${d.key}`} inputMode="decimal" value={d.apr} placeholder="—" onChange={(e) => setD(d.key, { apr: e.currentTarget.value })} /></label>
                    <label>Minimum<input id={`mi-min-${d.key}`} inputMode="decimal" value={d.min} placeholder="—" onChange={(e) => setD(d.key, { min: e.currentTarget.value })} /></label>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {(["Bill", "Subscription"] as const).map((kind) => {
          const rows = bs.filter((b) => b.kind === kind);
          if (!rows.length) return null;
          return (
            <section key={kind} aria-labelledby={`mi-${kind}`} className="mi-section">
              <h3 id={`mi-${kind}`} className="arc-h">{kind === "Bill" ? "Bills" : "Subscriptions"} ({rows.filter(billReady).length} of {rows.length} ready)</h3>
              {rows.map((b) => (
                <div key={b.key} className={`mi-row${b.exists ? " exists" : ""}`}>
                  <label className="mi-check">
                    <input type="checkbox" checked={b.include && !b.exists} disabled={b.exists} onChange={(e) => setB(b.key, { include: e.currentTarget.checked })} />
                    <b>{b.name}</b>
                    {b.exists ? <span className="tag-pill">Already added</span> : b.include && !billReady(b) ? <span className="overdue small">{parseMoney(b.amount || "") == null ? "Needs an amount" : "Needs a due day"}</span> : null}
                  </label>
                  {!b.exists && (
                    <div className="mi-fields">
                      <label>Amount<input id={`mi-amt-${b.key}`} inputMode="decimal" value={b.amount} placeholder="—" onChange={(e) => setB(b.key, { amount: e.currentTarget.value })} /></label>
                      <label>Due day (1–31)<input id={`mi-due-${b.key}`} inputMode="numeric" value={b.due} placeholder="—" onChange={(e) => setB(b.key, { due: e.currentTarget.value })} /></label>
                      <label className="mi-auto"><input type="checkbox" checked={b.autopay} onChange={(e) => setB(b.key, { autopay: e.currentTarget.checked })} /> Autopay</label>
                    </div>
                  )}
                </div>
              ))}
            </section>
          );
        })}

        <div className="form-actions mi-actions">
          <span className="hint-sm">{readyCount} ready to add{readyCount ? ` · ${usd(bs.filter(billReady).reduce((a, b) => a + (parseMoney(b.amount) ?? 0), 0))}/month in bills` : ""}</span>
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn" disabled={!readyCount || busy} onClick={run}>{busy ? "Adding…" : `Add ${readyCount}`}</button>
        </div>
      </div>
    </div>
  );
}
