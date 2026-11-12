"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase/client";

// Reusable post templates for the content bank (settings.content_templates, see supabase/phase7.sql).
// Words in [square brackets] are blanks to fill in.

export type ContentTemplate = {
  id: string;
  name: string;
  platform: string;
  format: string;
  pillar: string;
  title: string;
  hook: string;
  caption: string;
  hashtags: string;
};

export const DEFAULT_TEMPLATES: ContentTemplate[] = [
  {
    id: "youtube",
    name: "YouTube video",
    platform: "YouTube",
    format: "Long video",
    pillar: "Debt payoff tips",
    title: "[Number] ways to [result] without [pain point] (my debt-free method)",
    hook: "In the next [10] minutes, I'll show you exactly how to [result], even if [biggest objection].",
    caption: `VIDEO SCRIPT
1. Hook (0:00–0:15): [say the promise from the hook]
2. Who this is for + my story (0:15–1:00): [when I was in debt, I felt…]
3. Step 1: [what to do + one example]
4. Step 2: [what to do + one example]
5. Step 3: [what to do + one example]
6. The mistake to avoid: [common mistake + what to do instead]
7. Recap + next step: [one-sentence recap] Then invite them to [freebie / coaching call]

THUMBNAIL TEXT (3–5 words): [e.g. "$18K PAID OFF"]

DESCRIPTION
In this video I share [topic] so you can [result] without [pain point].

Chapters
0:00 Intro
[0:45] Step 1: [name]
[3:00] Step 2: [name]
[5:30] Step 3: [name]
[8:00] Mistake to avoid

Free [budget template / guide]: [link]
Book a debt-free coaching call: [link]
Instagram: [@yourhandle]

This video is for education only and isn't financial advice.`,
    hashtags: "#debtfree #debtfreejourney #budgeting #personalfinance #moneytips",
  },
  {
    id: "pinterest",
    name: "Pinterest pin",
    platform: "Pinterest",
    format: "Pin",
    pillar: "Budgeting",
    title: "[Result] in [timeframe]: [number] simple steps",
    hook: "How I [paid off $X / saved $X] in [timeframe]",
    caption: `TEXT ON THE IMAGE (big and readable): [the hook above, 6–10 words]

PIN TITLE (up to 100 characters): [keyword first, e.g. "Debt Snowball Plan for Beginners: 5 Simple Steps"]

DESCRIPTION (up to 500 characters):
Ready to [result]? These [number] simple steps helped me [proof, e.g. pay off $18,000 in 14 months]. Save this pin for your next money date, then grab the free [budget template / guide] at the link.

LINK: [blog post, freebie or booking page]
BOARD: [Debt-Free Living / Budgeting Tips / Money Mindset]
KEYWORDS: [debt payoff plan], [budgeting for beginners], [debt snowball], [how to save money]
IMAGE: 1000 × 1500 px (2:3), brand pinks, your logo small at the bottom`,
    hashtags: "#debtfree #budgetingtips #moneytips",
  },
];

export async function getTemplates(): Promise<ContentTemplate[]> {
  const res = await supabase().from("settings").select("content_templates").maybeSingle();
  // Before phase7.sql is run the column doesn't exist: use the built-in templates.
  if (res.error) return DEFAULT_TEMPLATES;
  const saved = res.data?.content_templates as ContentTemplate[] | null | undefined;
  return saved?.length ? saved : DEFAULT_TEMPLATES;
}

export async function saveTemplates(list: ContentTemplate[]) {
  const db = supabase();
  const existing = await db.from("settings").select("user_id").maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  const res = existing.data
    ? await db.from("settings").update({ content_templates: list }).eq("user_id", existing.data.user_id)
    : await db.from("settings").insert({ content_templates: list });
  if (res.error) throw new Error(res.error.message);
}

export function useTemplates(onSaveError: () => void) {
  const [templates, setTemplates] = useState<ContentTemplate[]>(DEFAULT_TEMPLATES);
  useEffect(() => {
    let live = true;
    getTemplates().then((t) => live && setTemplates(t)).catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  function update(next: ContentTemplate[]) {
    setTemplates(next);
    saveTemplates(next).catch(onSaveError);
  }
  return { templates, update };
}
