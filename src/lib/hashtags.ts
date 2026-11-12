"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase/client";

// Saved hashtag sets (settings.hashtag_sets, see supabase/phase8.sql).

export type HashtagSet = { id: string; name: string; tags: string };

export const DEFAULT_SETS: HashtagSet[] = [
  { id: "debtfree", name: "Debt-free journey", tags: "#debtfree #debtfreejourney #debtfreecommunity #debtsnowball #payingoffdebt #debtpayoff #debtfreeliving" },
  { id: "budgeting", name: "Budgeting", tags: "#budgeting #budgetingtips #budgetplanner #budgetwithme #moneymanagement #savemoney #frugalliving" },
  { id: "mindset", name: "Money mindset", tags: "#moneymindset #financialfreedom #financialliteracy #moneytips #personalfinance #wealthmindset" },
  { id: "women", name: "Women & money", tags: "#womenandmoney #moneyforwomen #financiallyfree #moneyconfidence #financialwellness" },
  { id: "coaching", name: "Coaching", tags: "#moneycoach #financialcoach #debtcoach #budgetcoach #moneyandgraceco" },
];

/** Splits text into unique hashtags, adding # where it's missing. */
export function parseTags(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/[\s,]+/)) {
    const word = raw.replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, "");
    if (!word) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(`#${word}`);
  }
  return out;
}

/** Adds a set's tags to existing hashtags without repeating any. */
export function mergeTags(current: string, add: string) {
  return parseTags(`${current} ${add}`).join(" ");
}

export async function getSets(): Promise<HashtagSet[]> {
  const res = await supabase().from("settings").select("hashtag_sets").maybeSingle();
  // Before phase8.sql is run the column doesn't exist: use the built-in sets.
  if (res.error) return DEFAULT_SETS;
  const saved = res.data?.hashtag_sets as HashtagSet[] | null | undefined;
  return saved ?? DEFAULT_SETS;
}

export async function saveSets(list: HashtagSet[]) {
  const db = supabase();
  const existing = await db.from("settings").select("user_id").maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  const res = existing.data
    ? await db.from("settings").update({ hashtag_sets: list }).eq("user_id", existing.data.user_id)
    : await db.from("settings").insert({ hashtag_sets: list });
  if (res.error) throw new Error(res.error.message);
}

export function useHashtagSets(onSaveError: () => void) {
  const [sets, setSets] = useState<HashtagSet[]>(DEFAULT_SETS);
  useEffect(() => {
    let live = true;
    getSets().then((s) => live && setSets(s)).catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  function update(next: HashtagSet[]) {
    setSets(next);
    saveSets(next).catch(onSaveError);
  }
  return { sets, update };
}
