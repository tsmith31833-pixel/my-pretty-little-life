// Reads debts, bills and subscriptions from a spreadsheet's Money tab
// (like the Money & Grace Winter Arc workbook). Tables are found by their header row.

type Cell = string | number | boolean | Date | null | undefined;
export type SheetIn = { sheet: string; data: Cell[][] };

export type DebtRow = { name: string; start: number | null; balance: number | null; apr: number | null; min: number | null };
export type BillRow = { name: string; amount: number | null; dueDay: number | null; autopay: boolean; kind: "Bill" | "Subscription" };
export type ParsedMoney = { debts: DebtRow[]; bills: BillRow[]; notes: string[] };

const text = (c: Cell) => (c == null ? "" : String(c)).trim();
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const num = (c: Cell): number | null => {
  const s = text(c).replace(/[$,%\s]/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

function headerRow(data: Cell[][], first: string, second: string) {
  return data.findIndex((row) => {
    const cells = row.map((c) => norm(text(c)));
    const i = cells.findIndex((c) => c.startsWith(norm(first)));
    return i >= 0 && cells.slice(i + 1).some((c) => c.startsWith(norm(second)));
  });
}

/** Rows under a header until the first blank name or a TOTAL row. */
function tableRows(data: Cell[][], h: number) {
  const hr = data[h].map((c) => norm(text(c)));
  const nameCol = hr.findIndex(Boolean);
  const col = (word: string) => hr.findIndex((c) => c.startsWith(norm(word)));
  const rows: Cell[][] = [];
  for (const row of data.slice(h + 1)) {
    const name = text(row[nameCol]);
    if (!name || /^total$/i.test(name)) break;
    rows.push(row);
  }
  return { rows, nameCol, col };
}

export function parseMoneySheet(sheets: SheetIn[]): ParsedMoney {
  const notes: string[] = [];
  const sheet = sheets.find((s) => norm(s.sheet) === "money") ?? sheets.find((s) => norm(s.sheet).includes("money"));
  if (!sheet) return { debts: [], bills: [], notes: ["No Money tab was found in this file."] };
  const data = sheet.data;
  if (data.some((r) => r.some((c) => /first row in each table is an example/i.test(text(c))))) {
    notes.push("Your Money tab says the first row of each table is an example. Check the numbers on Credit One Visa and Gas before importing.");
  }

  const debts: DebtRow[] = [];
  const dh = headerRow(data, "debt", "starting");
  if (dh >= 0) {
    const { rows, nameCol, col } = tableRows(data, dh);
    const cStart = col("starting"), cApr = col("apr"), cMin = col("min"), cBal = col("current");
    for (const r of rows) {
      let apr = num(r[cApr]);
      if (apr != null && apr > 0 && apr <= 1) apr = Math.round(apr * 10000) / 100; // 0.24 → 24%
      debts.push({ name: text(r[nameCol]), start: num(r[cStart]), balance: num(r[cBal]), apr, min: num(r[cMin]) });
    }
  }

  const bills: BillRow[] = [];
  for (const [label, kind] of [["bill", "Bill"], ["subscriptions", "Subscription"]] as const) {
    const h = headerRow(data, label, "amount");
    if (h < 0) continue;
    const { rows, nameCol, col } = tableRows(data, h);
    const cAmt = col("amount"), cDue = col("due"), cAuto = col("autopay");
    for (const r of rows) {
      const due = num(r[cDue]);
      bills.push({
        name: text(r[nameCol]),
        amount: num(r[cAmt]),
        dueDay: due != null && due >= 1 && due <= 31 ? Math.round(due) : null,
        autopay: /^y/i.test(text(r[cAuto])),
        kind,
      });
    }
  }

  if (!debts.length && !bills.length) notes.push("No Debt, Bill or Subscriptions tables were found on the Money tab.");
  return { debts, bills, notes };
}
