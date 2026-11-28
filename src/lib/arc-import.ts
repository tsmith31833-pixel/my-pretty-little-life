// Reads a Winter Arc spreadsheet (like "Money_and_Grace_Winter_Arc_2026.xlsx") into an arc.
// Tables are found by their header words, not fixed cell positions, so adding rows
// or moving a table around in the spreadsheet still works.

import type { Arc, ArcData, ArcWeek, Check, Measure, RhythmDay, WeekPlan } from "./arc";
import { DEFAULT_THEMES, WEEKS } from "./arc";

type Cell = string | number | boolean | Date | null | undefined;
export type SheetIn = { sheet: string; data: Cell[][] };

export type ParsedArc = {
  name: string;
  start_day: string | null;
  goals: string[];
  habits: string[];
  weeks: { theme: string; outcomes: string[]; plan: WeekPlan; actuals: Record<string, number | null> }[];
  measures: Measure[];
  rhythm: RhythmDay[];
  meta: NonNullable<ArcData["meta"]>;
  notes: string[]; // things worth telling you about the import
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const text = (c: Cell) => (c == null ? "" : c instanceof Date ? c.toISOString().slice(0, 10) : String(c)).trim();
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+]/g, "");
const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

function findSheet(sheets: SheetIn[], ...names: string[]) {
  const wanted = names.map(norm);
  return sheets.find((s) => wanted.some((w) => norm(s.sheet).includes(w)));
}

/** Row index whose cells include every given header word (case-insensitive). */
function headerRow(data: Cell[][], ...words: string[]) {
  return data.findIndex((row) => words.every((w) => row.some((c) => norm(text(c)) === norm(w))));
}
const colOf = (row: Cell[], word: string) => row.findIndex((c) => norm(text(c)).startsWith(norm(word)));

/** "1) Do this. 2) Do that." or "A) … B) …" → ["Do this.", "Do that."] */
export function splitList(s: string): string[] {
  const parts = s.split(/(?:^|\s)(?:\d{1,2}|[A-Ha-h])\)\s+/).map((p) => p.trim()).filter(Boolean);
  return parts.length > 1 ? parts : s.trim() ? [s.trim()] : [];
}

/** Short habit name: "5-min money check (balance + today's spending)." → "5-min money check" */
const shortName = (s: string) => s.replace(/\s*\(.*$/, "").replace(/[.:;]+$/, "").trim().slice(0, 60);

/** First "Mon Oct 12, 2026"-style date in a string. */
function firstDate(s: string): string | null {
  const m = s.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/i);
  if (!m) return null;
  return iso(Number(m[3]), MONTHS.indexOf(m[1].toLowerCase().slice(0, 3)), Number(m[2]));
}

/** Key-value tab ("Start Here"): label in one column, value in the next. */
function keyValues(data: Cell[][]) {
  const out = new Map<string, string>();
  for (const row of data) {
    const cells = row.map(text);
    const k = cells.findIndex(Boolean);
    if (k >= 0 && cells[k + 1]) out.set(norm(cells[k]), cells[k + 1]);
  }
  return out;
}

export function parseArcWorkbook(sheets: SheetIn[]): ParsedArc {
  const notes: string[] = [];

  // ---------- Start Here ----------
  const start = findSheet(sheets, "start here", "start");
  const kv = start ? keyValues(start.data) : new Map<string, string>();
  const startCells = (start?.data ?? []).flat().map(text).filter(Boolean);
  const title = startCells[0] ?? "Winter Arc";
  const name = (title.includes("|") ? title.split("|").pop()! : title).trim().slice(0, 40) || "Winter Arc";
  const tagline = startCells.find((c) => /\b\d{1,2}\s+weeks?\b/i.test(c)) ?? "";
  let start_day = firstDate(tagline);

  const goals = [...kv.entries()]
    .filter(([k]) => k.startsWith("primarygoal"))
    .map(([, v]) => v);
  const secondary = kv.get("secondarygoals");
  if (secondary) goals.push(...splitList(secondary));
  const habits = splitList(kv.get("dailynonnegotiables") ?? "").map(shortName).filter(Boolean);

  // ---------- 12-Week Plan ----------
  const planSheet = findSheet(sheets, "12-week plan", "12 week plan", "plan");
  const weeks: ParsedArc["weeks"] = Array.from({ length: WEEKS }, (_, i) => ({ theme: DEFAULT_THEMES[i], outcomes: [], plan: {}, actuals: {} }));
  const weekDates: (string | null)[] = Array(WEEKS).fill(null);
  if (planSheet) {
    const h = headerRow(planSheet.data, "week", "theme");
    if (h >= 0) {
      const hr = planSheet.data[h];
      const c = {
        week: colOf(hr, "week"), dates: colOf(hr, "dates"), theme: colOf(hr, "theme"), outcomes: colOf(hr, "top"),
        tasks: colOf(hr, "key tasks"), business: colOf(hr, "business"), money: colOf(hr, "money"),
        fitness: colOf(hr, "fitness"), home: colOf(hr, "home"), ignore: colOf(hr, "what to ignore"),
      };
      for (const row of planSheet.data.slice(h + 1)) {
        const m = text(row[c.week]).match(/^w(?:eek)?\s*(\d{1,2})$/i);
        if (!m) continue;
        const i = Number(m[1]) - 1;
        if (i < 0 || i >= WEEKS) continue;
        const get = (k: number) => (k >= 0 ? text(row[k]) : "");
        weeks[i].theme = get(c.theme) || weeks[i].theme;
        weeks[i].outcomes = splitList(get(c.outcomes));
        weeks[i].plan = {
          tasks: get(c.tasks) || undefined, business: get(c.business) || undefined, money: get(c.money) || undefined,
          fitness: get(c.fitness) || undefined, home: get(c.home) || undefined, ignore: get(c.ignore) || undefined,
        };
        weekDates[i] = get(c.dates) || null;
      }
    } else notes.push("The 12-Week Plan tab didn't have a “Week” and “Theme” header row, so week themes use the defaults.");
  } else notes.push("No 12-Week Plan tab was found.");

  // Start date fallback: Week 2's dates minus 7 days (more reliable than Week 1 if it was copied from elsewhere).
  if (!start_day) {
    for (let i = 0; i < WEEKS && !start_day; i++) {
      const m = weekDates[i]?.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})/i);
      const y = tagline.match(/\b(20\d{2})\b/)?.[1] ?? String(new Date().getFullYear());
      if (m) {
        const d = new Date(Number(y), MONTHS.indexOf(m[1].toLowerCase().slice(0, 3)), Number(m[2]) - i * 7, 12);
        start_day = iso(d.getFullYear(), d.getMonth(), d.getDate());
      }
    }
  }
  // Flag a week whose listed dates don't match the start date.
  if (start_day) {
    const s = new Date(`${start_day}T12:00:00`);
    weekDates.forEach((label, i) => {
      const m = label?.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})/i);
      if (!m) return;
      const expected = new Date(s);
      expected.setDate(s.getDate() + i * 7);
      if (expected.getMonth() !== MONTHS.indexOf(m[1].toLowerCase().slice(0, 3)) || expected.getDate() !== Number(m[2])) {
        notes.push(`Week ${i + 1} is listed as “${label}”, but counting from the start date it begins ${MONTHS[expected.getMonth()][0].toUpperCase()}${MONTHS[expected.getMonth()].slice(1)} ${expected.getDate()}. The app uses the start date.`);
      }
    });
  } else notes.push("No start date was found. Set it in Arc details.");

  // ---------- Scoreboard ----------
  const measures: Measure[] = [];
  const score = findSheet(sheets, "scoreboard", "score");
  if (score) {
    const h = headerRow(score.data, "area", "weekly target");
    if (h >= 0) {
      const hr = score.data[h];
      const cArea = colOf(hr, "area"), cName = colOf(hr, "lead"), cTarget = colOf(hr, "weekly target");
      const weekCols = hr.map((v, k) => [text(v).match(/^w(\d{1,2})$/i), k] as const).filter(([m]) => m).map(([m, k]) => [Number(m![1]) - 1, k] as const);
      score.data.slice(h + 1).forEach((row, r) => {
        const area = text(row[cArea]);
        const nameCell = text(row[cName]);
        const target = Number(text(row[cTarget]));
        if (!area || !nameCell || !Number.isFinite(target) || target <= 0) return;
        const id = `m${r}_${norm(nameCell).slice(0, 24)}`;
        measures.push({ id, area: area.charAt(0) + area.slice(1).toLowerCase(), name: nameCell, target });
        for (const [wi, k] of weekCols) {
          const v = text(row[k]);
          if (v !== "" && wi >= 0 && wi < WEEKS && Number.isFinite(Number(v))) weeks[wi].actuals[id] = Number(v);
        }
      });
    }
  }

  // ---------- Daily + Weekly Rhythm ----------
  const rhythm: RhythmDay[] = [];
  let bareMinimum: string | undefined;
  const rh = findSheet(sheets, "rhythm", "daily");
  if (rh) {
    const h = headerRow(rh.data, "day", "theme");
    if (h >= 0) {
      const hr = rh.data[h];
      const cDay = colOf(hr, "day"), cTheme = colOf(hr, "theme"), cMin = colOf(hr, "minimum"), cFull = colOf(hr, "full");
      for (const row of rh.data.slice(h + 1)) {
        const day = text(row[cDay]);
        if (!/^(mon|tue|wed|thu|fri|sat|sun)/i.test(day)) {
          if (rhythm.length) break;
          continue;
        }
        rhythm.push({ day: day.slice(0, 3), theme: text(row[cTheme]), min: text(row[cMin]), full: text(row[cFull]) });
      }
    }
    for (const row of rh.data) {
      const cells = row.map(text);
      const k = cells.findIndex((c) => /bare\s*minimum/i.test(c));
      if (k >= 0) bareMinimum = cells.slice(k + 1).filter(Boolean).pop();
    }
  }

  // ---------- Content (one video idea per week) ----------
  const content = findSheet(sheets, "content");
  if (content) {
    const h = headerRow(content.data, "week", "hook");
    if (h >= 0) {
      const hr = content.data[h];
      const cWeek = colOf(hr, "week"), cIdea = colOf(hr, "video"), cHook = colOf(hr, "hook"), cPub = colOf(hr, "published");
      for (const row of content.data.slice(h + 1)) {
        const m = text(row[cWeek]).match(/^w(?:eek)?\s*(\d{1,2})$/i);
        if (!m) continue;
        const i = Number(m[1]) - 1;
        const idea = text(row[cIdea]);
        if (i >= 0 && i < WEEKS && idea) {
          weeks[i].plan.video = { idea, hook: text(row[cHook]) || undefined, published: /^y/i.test(text(row[cPub])) };
        }
      }
    }
  }

  return {
    name,
    start_day,
    goals,
    habits,
    weeks,
    measures,
    rhythm,
    meta: {
      tagline: tagline || undefined,
      theme: kv.get("theme"),
      weeklyNonNegotiables: kv.get("weeklynonnegotiables"),
      milestones: kv.get("monthlymilestones"),
      bareMinimum,
    },
    notes,
  };
}

const rid = () => Math.random().toString(36).slice(2, 9);

/** Builds the arc from the spreadsheet, keeping everything you've already done:
 *  ticked goals, daily hearts, scoreboard numbers you typed, reflections and ratings. */
export function mergeImport(parsed: ParsedArc, existing: Arc | null, fileName: string): Omit<Arc, "id"> & { id?: string } {
  const old = existing?.data;
  const keepChecks = (texts: string[], prev: Check[] | undefined): Check[] => {
    const fromSheet = texts.map((t) => {
      const match = prev?.find((p) => norm(p.text) === norm(t));
      return { id: match?.id ?? rid(), text: t, done: match?.done ?? false };
    });
    const extras = (prev ?? []).filter((p) => !texts.some((t) => norm(t) === norm(p.text)));
    return [...fromSheet, ...extras];
  };
  const habits = parsed.habits.length
    ? parsed.habits.map((h) => old?.habits.find((o) => norm(o.name) === norm(h)) ?? { id: `h_${rid()}`, name: h })
    : old?.habits ?? [];
  const weeks: ArcWeek[] = parsed.weeks.map((w, i) => {
    const prev = old?.weeks[i];
    return {
      theme: w.theme,
      focus: prev?.focus ?? "",
      goals: keepChecks(w.outcomes, prev?.goals),
      checks: prev?.checks ?? {},
      wins: prev?.wins ?? "",
      lessons: prev?.lessons ?? "",
      rating: prev?.rating ?? 0,
      plan: w.plan,
      // Numbers typed in the app win; spreadsheet numbers fill any gaps.
      actuals: { ...w.actuals, ...Object.fromEntries(Object.entries(prev?.actuals ?? {}).filter(([, v]) => v != null)) },
    };
  });
  return {
    id: existing?.id,
    name: parsed.name || existing?.name || "Winter Arc",
    start_day: parsed.start_day ?? existing?.start_day ?? new Date().toISOString().slice(0, 10),
    data: {
      goals: keepChecks(parsed.goals, old?.goals),
      habits,
      weeks,
      measures: parsed.measures.length ? parsed.measures : old?.measures,
      rhythm: parsed.rhythm.length ? parsed.rhythm : old?.rhythm,
      meta: { ...parsed.meta, importedFrom: fileName, importedAt: new Date().toISOString().slice(0, 10) },
    },
  };
}
