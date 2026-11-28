"use client";

import { supabase } from "./supabase/client";
import type { ContentItem } from "./money";

// Content insights: your post performance, competitors, and idea suggestions
// (tables from supabase/phase10.sql).

export type Stats = { views: number | null; likes: number | null; comments: number | null; saves: number | null; shares?: number | null; clicks: number | null };
export type MyPost = ContentItem & Stats & { url: string | null; stats_updated: string | null };
export type Competitor = { id: string; name: string; platform: string; handle: string | null; url: string | null; notes: string | null };
export type CompPost = Stats & {
  id: string; competitor_id: string; platform: string; title: string; url: string | null; format: string | null; pillar: string | null; posted_day: string | null;
};

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}
const db = () => supabase();

// ---------- your posts ----------
export async function listMyPosts() {
  return check<MyPost[]>(
    await db().from("content_items")
      .select("id, title, platform, format, pillar, status, hook, caption, hashtags, post_day, url, views, likes, comments, saves, shares, clicks, stats_updated")
      .eq("status", "Posted").order("post_day", { ascending: false }),
  );
}
export async function saveMyStats(id: string, s: Stats & { url: string | null }) {
  check(await db().from("content_items").update({ ...s, stats_updated: new Date().toISOString().slice(0, 10) }).eq("id", id));
}

// ---------- competitors ----------
export async function listCompetitors() {
  return check<Competitor[]>(await db().from("competitors").select("id, name, platform, handle, url, notes").order("created_at"));
}
export async function addCompetitor(c: Omit<Competitor, "id">) {
  return check<Competitor>(await db().from("competitors").insert(c).select("id, name, platform, handle, url, notes").single());
}
export async function deleteCompetitor(id: string) {
  check(await db().from("competitors").delete().eq("id", id));
}
export async function listCompPosts() {
  return check<CompPost[]>(
    await db().from("competitor_posts")
      .select("id, competitor_id, platform, title, url, format, pillar, posted_day, views, likes, comments, saves, clicks")
      .order("posted_day", { ascending: false, nullsFirst: false }),
  );
}
export async function addCompPost(p: Omit<CompPost, "id">) {
  check(await db().from("competitor_posts").insert(p));
}
export async function deleteCompPost(id: string) {
  check(await db().from("competitor_posts").delete().eq("id", id));
}
/** Adds new posts and refreshes the numbers on ones already tracked (matched by link). */
export async function upsertCompPosts(competitorId: string, posts: Omit<CompPost, "id" | "competitor_id">[], existing: CompPost[]) {
  let added = 0;
  for (const p of posts) {
    const match = existing.find((e) => e.competitor_id === competitorId && e.url && e.url === p.url);
    if (match) {
      check(await db().from("competitor_posts").update({ views: p.views, likes: p.likes, comments: p.comments, updated_at: new Date().toISOString() }).eq("id", match.id));
    } else {
      check(await db().from("competitor_posts").insert({ ...p, competitor_id: competitorId }));
      added++;
    }
  }
  return added;
}

// ---------- YouTube lookups (through /api/youtube) ----------
export type YtVideo = { id: string; title: string; url: string; posted_day: string; views: number; likes: number; comments: number; format: string };
async function api<T>(query: string): Promise<T> {
  const res = await fetch(`/api/youtube?${query}`, { cache: "no-store" });
  const body = await res.json().catch(() => ({ error: "YouTube lookup failed." }));
  if (!res.ok) throw new Error(body.error ?? "YouTube lookup failed.");
  return body as T;
}
export const fetchVideo = (url: string) => api<{ video: YtVideo }>(`video=${encodeURIComponent(url)}`).then((r) => r.video);
export const fetchChannel = (handle: string) => api<{ channel: { title: string; subscribers: number }; videos: YtVideo[] }>(`channel=${encodeURIComponent(handle)}`);

// ---------- analysis ----------
export type Row = { source: string; mine: boolean; title: string; platform: string; format: string; pillar: string; views: number; engagement: number | null; posted_day: string | null; url: string | null; score: number };

/** Interactions per view (Pinterest: saves + clicks per impression). */
export function engagementOf(s: Stats, platform: string) {
  if (!s.views) return null;
  const acts = platform === "Pinterest" ? (s.saves ?? 0) + (s.clicks ?? 0) : (s.likes ?? 0) + (s.comments ?? 0) + (s.saves ?? 0) + (s.shares ?? 0);
  return acts / s.views;
}

/** Puts your posts and competitors' posts in one list. `score` = views ÷ that account's average,
 *  so a small account's breakout counts as much as a big account's. */
export function buildRows(mine: MyPost[], comps: Competitor[], compPosts: CompPost[], platform: string): Row[] {
  const rows: Omit<Row, "score">[] = [
    ...mine.filter((p) => p.views != null).map((p) => ({
      source: "You", mine: true, title: p.title, platform: p.platform, format: p.format, pillar: p.pillar, views: p.views ?? 0,
      engagement: engagementOf(p, p.platform), posted_day: p.post_day, url: p.url,
    })),
    ...compPosts.filter((p) => p.views != null).map((p) => ({
      source: comps.find((c) => c.id === p.competitor_id)?.name ?? "Competitor", mine: false, title: p.title, platform: p.platform,
      format: p.format ?? "Other", pillar: p.pillar ?? "Other", views: p.views ?? 0, engagement: engagementOf(p, p.platform), posted_day: p.posted_day, url: p.url,
    })),
  ].filter((r) => platform === "All" || r.platform === platform);
  const avg = new Map<string, number>();
  for (const src of new Set(rows.map((r) => r.source))) {
    const vs = rows.filter((r) => r.source === src).map((r) => r.views);
    avg.set(src, vs.reduce((a, b) => a + b, 0) / Math.max(1, vs.length));
  }
  return rows.map((r) => ({ ...r, score: avg.get(r.source) ? r.views / avg.get(r.source)! : 0 }));
}

export type SourceSummary = { source: string; mine: boolean; posts: number; avgViews: number; avgEngagement: number | null; best: Row | null };
export function summarize(rows: Row[]): SourceSummary[] {
  const out: SourceSummary[] = [];
  for (const src of new Set(rows.map((r) => r.source))) {
    const rs = rows.filter((r) => r.source === src);
    const engs = rs.map((r) => r.engagement).filter((e): e is number => e != null);
    out.push({
      source: src,
      mine: rs[0].mine,
      posts: rs.length,
      avgViews: rs.reduce((a, r) => a + r.views, 0) / rs.length,
      avgEngagement: engs.length ? engs.reduce((a, b) => a + b, 0) / engs.length : null,
      best: [...rs].sort((a, b) => b.views - a.views)[0] ?? null,
    });
  }
  return out.sort((a, b) => (a.mine === b.mine ? b.avgViews - a.avgViews : a.mine ? -1 : 1));
}

/** Average outperformance by topic or format (1.0 = typical for that account). */
export function groupScores(rows: Row[], key: "pillar" | "format") {
  const groups = new Map<string, number[]>();
  for (const r of rows) groups.set(r[key], [...(groups.get(r[key]) ?? []), r.score]);
  return [...groups.entries()]
    .map(([name, scores]) => ({ name, posts: scores.length, score: scores.reduce((a, b) => a + b, 0) / scores.length }))
    .filter((g) => g.posts >= 1)
    .sort((a, b) => b.score - a.score);
}

/** Title habits of the best quarter of posts versus the rest. */
export function titlePatterns(rows: Row[]) {
  if (rows.length < 4) return [];
  const sorted = [...rows].sort((a, b) => b.score - a.score);
  const top = sorted.slice(0, Math.max(1, Math.round(sorted.length / 4)));
  const rest = sorted.slice(top.length);
  const tests: [string, (t: string) => boolean][] = [
    ["Has a number", (t) => /\d/.test(t)],
    ["Mentions money ($)", (t) => /\$|dollar|debt|budget|save|paid/i.test(t)],
    ["Says “I” or “my”", (t) => /\b(i|my|i'm|i've)\b/i.test(t)],
    ["Says “you”", (t) => /\byou(r)?\b/i.test(t)],
    ["Is a “how to”", (t) => /\bhow\b/i.test(t)],
    ["Asks a question", (t) => t.includes("?")],
  ];
  const share = (list: Row[], f: (t: string) => boolean) => (list.length ? list.filter((r) => f(r.title)).length / list.length : 0);
  return tests.map(([label, f]) => ({ label, top: share(top, f), rest: share(rest, f) })).filter((p) => p.top > 0 || p.rest > 0);
}

// ---------- idea suggestions ----------
export type Suggestion = { title: string; platform: string; format: string; pillar: string; hook: string; reason: string };

const clean = (t: string) => t.replace(/\s+[|–-]\s+[^|–-]*$/, "").replace(/[#].*$/, "").replace(/\s+/g, " ").trim();
const numberIn = (t: string) => t.match(/\d+/)?.[0];
const lowerTopic = (p: string) => (p === "Other" ? "money" : p.toLowerCase());

/** Turns the best-performing posts into fresh angles. Rule-based: it remixes what's working
 *  (topic, format, title style) rather than copying anyone's post. */
export function suggestIdeas(rows: Row[], platform: string, max = 8): Suggestion[] {
  const best = [...rows].filter((r) => r.views > 0).sort((a, b) => b.score - a.score).slice(0, 6);
  const out: Suggestion[] = [];
  const seen = new Set<string>();
  const push = (s: Suggestion) => {
    const k = s.title.toLowerCase();
    if (!seen.has(k) && out.length < max) {
      seen.add(k);
      out.push(s);
    }
  };
  for (const r of best) {
    const t = clean(r.title);
    const n = numberIn(t) ?? "5";
    const topic = lowerTopic(r.pillar);
    const why = `${r.mine ? "Your post" : `${r.source}'s post`} “${t}” got ${r.score.toFixed(1)}× ${r.mine ? "your" : "their"} usual views`;
    const ytFormat = r.format === "Short" ? "Short" : "Long video";
    if (r.mine) {
      push({ title: `${t}: part 2 (what I didn't have time to tell you)`, platform: r.platform, format: r.format, pillar: r.pillar, hook: "So many of you asked for part 2, so here it is.", reason: `${why}. Sequels to winners often do well.` });
    } else {
      push({ title: `I tried "${t}" for 30 days. Here's what happened`, platform: "YouTube", format: ytFormat, pillar: r.pillar, hook: `Everyone's talking about this. I tested it with my real money.`, reason: `${why}. Give the same topic your own story and proof.` });
    }
    push({ title: `${n} ${topic} mistakes that keep you in debt (and what to do instead)`, platform: r.platform, format: r.format, pillar: r.pillar, hook: `Mistake #1 cost me hundreds and I didn't even notice.`, reason: `${why}. Mistakes and “what to do instead” angles pull in the same viewers.` });
    push({ title: `${topic.charAt(0).toUpperCase() + topic.slice(1)} for complete beginners: start here`, platform: r.platform, format: r.format, pillar: r.pillar, hook: `If you're starting from zero, start with this.`, reason: `${why}. A beginner version reaches people the original was too advanced for.` });
    if (r.platform === "YouTube") {
      push({ title: `${t} (save this checklist)`, platform: "Pinterest", format: "Pin", pillar: r.pillar, hook: `${n}-step ${topic} checklist`, reason: `${why}. Turn a winning video into a pin that links back to it.` });
    } else if (r.platform === "Pinterest") {
      push({ title: `${t}: full walkthrough`, platform: "YouTube", format: "Long video", pillar: r.pillar, hook: `Here's exactly how I do it, step by step.`, reason: `${why}. Pins that get saved make great step-by-step videos.` });
    }
  }
  return out;
}
