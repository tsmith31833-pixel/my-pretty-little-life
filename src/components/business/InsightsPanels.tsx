"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { CardHeader } from "../home/CardHeader";
import { DeleteButton } from "../ui";
import { FORMATS, PILLARS, PLATFORMS, saveContent, useRows } from "@/lib/money";
import {
  addCompPost, addCompetitor, buildRows, deleteCompPost, deleteCompetitor, engagementOf, fetchChannel, fetchVideo, groupScores,
  listCompPosts, listCompetitors, listMyPosts, saveMyStats, suggestIdeas, summarize, titlePatterns, upsertCompPosts,
  type CompPost, type Competitor, type MyPost, type Row,
} from "@/lib/insights";
import { MONTHS, isoDate } from "@/lib/dates";
import { heartBurst } from "@/lib/hearts";

const fmt = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 10_000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n)));
const pct = (e: number | null) => (e == null ? "–" : `${(e * 100).toFixed(1)}%`);
const toNum = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").replace(/[,\s]/g, "");
  if (!s) return null;
  const n = Math.round(Number(s.replace(/k$/i, "")) * (/k$/i.test(s) ? 1000 : 1));
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const viewWord = (platform: string) => (platform === "Pinterest" ? "Impressions" : "Views");

type Toast = (m: string) => void;
const setupHint = "If this is your first time here, run supabase/phase10.sql in Supabase.";

// =====================================================================
// Insights: you vs competitors, what's working, suggestions, your numbers
// =====================================================================
export function InsightsPanel({ now, toast, onIdeasSaved }: { now: Date; toast: Toast; onIdeasSaved: () => void }) {
  const mine = useRows(listMyPosts, []);
  const comps = useRows(listCompetitors, []);
  const posts = useRows(listCompPosts, []);
  const [platform, setPlatform] = useState<"All" | "YouTube" | "Pinterest">("All");
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const failed = mine.failed || comps.failed || posts.failed;
  const rows = buildRows(mine.data ?? [], comps.data ?? [], posts.data ?? [], platform);
  const sum = summarize(rows);
  const top = [...rows].sort((a, b) => b.score - a.score).slice(0, 8);
  const topics = groupScores(rows, "pillar").slice(0, 5);
  const formats = groupScores(rows, "format").slice(0, 5);
  const patterns = titlePatterns(rows);
  const ideas = suggestIdeas(rows, platform);
  const maxAvg = Math.max(1, ...sum.map((s) => s.avgViews));

  // Your progress: posts and views per month, last 6 months.
  const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1));
  const myPosts = (mine.data ?? []).filter((p) => platform === "All" || p.platform === platform);
  const perMonth = months.map((m) => {
    const key = isoDate(m).slice(0, 7);
    const ps = myPosts.filter((p) => p.post_day?.startsWith(key));
    return { label: MONTHS[m.getMonth()].slice(0, 3), posts: ps.length, views: ps.reduce((a, p) => a + (p.views ?? 0), 0) };
  });

  async function saveIdea(i: (typeof ideas)[number]) {
    try {
      await saveContent({ title: i.title, platform: i.platform, format: i.format, pillar: PILLARS.includes(i.pillar) ? i.pillar : "Other", status: "Idea", hook: i.hook, caption: null, hashtags: null, post_day: null });
      setSaved(new Set([...saved, i.title]));
      toast("Saved to your content bank.");
      onIdeasSaved();
    } catch {
      toast(`That idea didn't save. ${setupHint}`);
    }
  }

  const empty = (mine.data && posts.data) && rows.length === 0;

  return (
    <div className="stack">
      <div className="insights-bar">
        <div className="seg" role="tablist" aria-label="Platform">
          {(["All", "YouTube", "Pinterest"] as const).map((p) => (
            <button key={p} type="button" role="tab" aria-selected={platform === p} className={platform === p ? "on" : ""} onClick={() => setPlatform(p)}>{p}</button>
          ))}
        </div>
        <p className="hint-sm">Scores compare each post with its own account&apos;s average, so a small account&apos;s breakout counts as much as a big one&apos;s.</p>
      </div>

      {failed && <p className="auth-err">Your insights couldn&apos;t load. Check your internet connection, then refresh. {setupHint}</p>}
      {empty && (
        <section className="card empty-card">
          <p className="empty">No numbers yet. Add views and likes to your posted content below, and add a few competitors on the <b>Competitors</b> tab. Insights and idea suggestions appear here as soon as there&apos;s data.</p>
        </section>
      )}

      {rows.length > 0 && (
        <div className="split">
          <section className="card" aria-labelledby="h-vs">
            <CardHeader id="h-vs" icon="star" eyebrow="Side by side" title="You vs competitors" />
            <div className="vs-list">
              {sum.map((s) => (
                <div className={`vs-row${s.mine ? " is-me" : ""}`} key={s.source}>
                  <div className="lbl"><b>{s.source}</b><span>{s.posts} {s.posts === 1 ? "post" : "posts"} · {pct(s.avgEngagement)} engagement</span></div>
                  <div className="vs-bar"><i style={{ width: `${Math.max(2, (s.avgViews / maxAvg) * 100)}%` }} /><span>{fmt(s.avgViews)} avg</span></div>
                </div>
              ))}
            </div>
            <p className="hint-sm">Average {platform === "Pinterest" ? "impressions" : "views"} per post. Engagement is likes, comments, saves and shares per view (Pinterest: saves and clicks per impression).</p>
          </section>

          <section className="card" aria-labelledby="h-works">
            <CardHeader id="h-works" icon="sparkle" eyebrow="Patterns" title="What's working" />
            <ScoreList title="Topics" items={topics} />
            <ScoreList title="Formats" items={formats} />
            {patterns.length > 0 && (
              <div className="arc-block">
                <h3 className="arc-h">Title habits of the top 25%</h3>
                <table className="mini-table">
                  <thead><tr><th scope="col">Title…</th><th scope="col">Top posts</th><th scope="col">The rest</th></tr></thead>
                  <tbody>
                    {patterns.map((p) => (
                      <tr key={p.label} className={p.top - p.rest >= 0.2 ? "win" : ""}>
                        <th scope="row">{p.label}</th><td>{Math.round(p.top * 100)}%</td><td>{Math.round(p.rest * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {ideas.length > 0 && (
        <section className="card" aria-labelledby="h-ideas">
          <CardHeader id="h-ideas" icon="sparkle" eyebrow="Inspired by your best performers" title="Suggested ideas" meta={<><b>{ideas.length}</b>ideas</>} />
          <p className="lede-sm">Fresh angles on what&apos;s working right now: your own breakouts and competitors&apos; top posts. Make each one yours with your story and numbers.</p>
          <div className="content-grid">
            {ideas.map((i) => (
              <article className="content-card idea-card" key={i.title}>
                <div className="cc-top"><span className="tag-pill">{i.platform} · {i.format}</span><span className="muted small">{i.pillar}</span></div>
                <h3 className="tpl-title">{i.title}</h3>
                <p className="cc-hook">“{i.hook}”</p>
                <p className="cc-cap">{i.reason}</p>
                <div className="cc-actions">
                  {saved.has(i.title) ? <span className="ok">Saved ✓</span> : (
                    <button type="button" className="btn sm" onClick={(e) => { heartBurst(e.currentTarget); saveIdea(i); }}>Save to content bank</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {top.length > 0 && (
        <section className="card" aria-labelledby="h-top">
          <CardHeader id="h-top" icon="star" eyebrow="Ranked by score" title="Top performers" />
          <div className="table-scroll">
            <table className="mini-table wide">
              <thead><tr><th scope="col">Post</th><th scope="col">Account</th><th scope="col">{platform === "Pinterest" ? "Impr." : "Views"}</th><th scope="col">Eng.</th><th scope="col">Score</th></tr></thead>
              <tbody>
                {top.map((r, i) => (
                  <tr key={`${r.source}-${r.title}-${i}`} className={r.mine ? "is-me" : ""}>
                    <th scope="row">{r.url ? <a href={r.url} target="_blank" rel="noreferrer">{r.title}</a> : r.title}<small>{r.platform} · {r.format} · {r.pillar}</small></th>
                    <td>{r.source}</td><td>{fmt(r.views)}</td><td>{pct(r.engagement)}</td><td><b>{r.score.toFixed(1)}×</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="card" aria-labelledby="h-prog">
        <CardHeader id="h-prog" icon="calendar" eyebrow="Last 6 months" title="Your progress" />
        <div className="prog-months">
          {perMonth.map((m) => {
            const max = Math.max(1, ...perMonth.map((x) => x.views));
            return (
              <div className="pm" key={m.label} title={`${m.label}: ${m.posts} posts, ${fmt(m.views)} ${platform === "Pinterest" ? "impressions" : "views"}`}>
                <span className="pm-v">{m.views ? fmt(m.views) : ""}</span>
                <div className="pm-bar"><i style={{ height: `${(m.views / max) * 100}%` }} /></div>
                <span className="pm-l">{m.label}</span>
                <span className="pm-p">{m.posts} {m.posts === 1 ? "post" : "posts"}</span>
              </div>
            );
          })}
        </div>
      </section>

      <MyNumbers posts={mine.data ?? []} toast={toast} onSaved={mine.reload} />
    </div>
  );
}

function ScoreList({ title, items }: { title: string; items: { name: string; posts: number; score: number }[] }) {
  if (!items.length) return null;
  const max = Math.max(...items.map((i) => i.score), 1);
  return (
    <div className="arc-block">
      <h3 className="arc-h">{title}</h3>
      <div className="rows">
        {items.map((i) => (
          <div className="row" key={i.name}>
            <div className="lbl"><span>{i.name}</span><span>{i.score.toFixed(1)}× usual · {i.posts} {i.posts === 1 ? "post" : "posts"}</span></div>
            <div className="bar" aria-hidden="true"><i className={i.score >= 1.2 ? "" : "gold"} style={{ width: `${(i.score / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MyNumbers({ posts, toast, onSaved }: { posts: MyPost[]; toast: Toast; onSaved: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="card" aria-labelledby="h-mine">
      <CardHeader id="h-mine" icon="coin" eyebrow="Track progress" title="Your posts' numbers" meta={<><b>{posts.length}</b>posted</>} />
      {posts.length === 0 && <p className="empty">Mark ideas as Posted in your content bank, then add their numbers here.</p>}
      <ul className="txn-list">
        {posts.map((p) => (
          <li key={p.id} className="num-li">
            <div className="todo-main">
              <span className="todo-title">{p.title}</span>
              <span className="todo-meta">
                <span className="tag-pill">{p.platform}</span>
                {p.views != null ? <span>{fmt(p.views)} {viewWord(p.platform).toLowerCase()} · {pct(engagementOf(p, p.platform))} engagement</span> : <span className="overdue">No numbers yet</span>}
                {p.stats_updated && <span>updated {p.stats_updated.slice(5).replace("-", "/")}</span>}
              </span>
            </div>
            <button type="button" className="btn ghost sm" onClick={() => setOpen(open === p.id ? null : p.id)}>{open === p.id ? "Close" : "Update numbers"}</button>
            {open === p.id && <StatsForm post={p} toast={toast} onSaved={() => { setOpen(null); onSaved(); }} />}
          </li>
        ))}
      </ul>
    </section>
  );
}

function StatsForm({ post, toast, onSaved }: { post: MyPost; toast: Toast; onSaved: () => void }) {
  const [vals, setVals] = useState({ url: post.url ?? "", views: post.views, likes: post.likes, comments: post.comments, saves: post.saves, shares: post.shares ?? null, clicks: post.clicks });
  const [busy, setBusy] = useState(false);
  const pin = post.platform === "Pinterest";
  const field = (k: "views" | "likes" | "comments" | "saves" | "shares" | "clicks", label: string) => (
    <label key={k}>{label}<input id={`st-${k}-${post.id}`} inputMode="numeric" value={vals[k] ?? ""} placeholder="0"
      onChange={(e) => setVals({ ...vals, [k]: toNum(e.currentTarget.value) })} /></label>
  );
  return (
    <form className="pform stats-form" onSubmit={async (e) => {
      e.preventDefault();
      setBusy(true);
      try {
        await saveMyStats(post.id, { ...vals, url: vals.url.trim() || null });
        toast("Numbers saved.");
        onSaved();
      } catch {
        toast(`Those numbers didn't save. ${setupHint}`);
      }
      setBusy(false);
    }}>
      <label className="full">Link to the post<input id={`st-url-${post.id}`} value={vals.url} onChange={(e) => setVals({ ...vals, url: e.currentTarget.value })} placeholder={pin ? "https://pinterest.com/pin/…" : "https://youtube.com/watch?v=…"} /></label>
      {field("views", viewWord(post.platform))}
      {pin ? field("saves", "Saves") : field("likes", "Likes")}
      {pin ? field("clicks", "Outbound clicks") : field("comments", "Comments")}
      {!pin && field("shares", "Shares")}
      {!pin && field("saves", "Saves")}
      <div className="form-actions full wrap">
        {post.platform === "YouTube" && (
          <button type="button" className="btn ghost sm" disabled={!vals.url || busy} onClick={async () => {
            setBusy(true);
            try {
              const v = await fetchVideo(vals.url);
              setVals({ ...vals, views: v.views, likes: v.likes, comments: v.comments });
              toast("Got the latest numbers from YouTube. Tap Save to keep them.");
            } catch (err) {
              toast(err instanceof Error ? err.message : "YouTube lookup failed.");
            }
            setBusy(false);
          }}>Fetch from YouTube</button>
        )}
        <button type="submit" className="btn sm" disabled={busy}>Save</button>
      </div>
    </form>
  );
}

// =====================================================================
// Competitors
// =====================================================================
export function CompetitorsPanel({ toast }: { toast: Toast }) {
  const comps = useRows(listCompetitors, []);
  const posts = useRows(listCompPosts, []);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const list = comps.data ?? [];
  const allPosts = posts.data ?? [];

  async function importLatest(c: Competitor) {
    if (!c.handle) return toast("Add their YouTube handle (like @creatorname) first.");
    setBusy(c.id);
    try {
      const { channel, videos } = await fetchChannel(c.handle);
      const added = await upsertCompPosts(c.id, videos.map((v) => ({
        platform: "YouTube", title: v.title, url: v.url, format: v.format, pillar: null, posted_day: v.posted_day,
        views: v.views, likes: v.likes, comments: v.comments, saves: null, clicks: null,
      })), allPosts);
      toast(`${channel.title}: ${added} new ${added === 1 ? "video" : "videos"} added, the rest refreshed.`);
      posts.reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Import failed.");
    }
    setBusy(null);
  }

  return (
    <div className="stack">
      <section className="card" aria-labelledby="h-comp">
        <CardHeader id="h-comp" icon="star" eyebrow="Learn from the best" title="Competitors" meta={<><b>{list.length}</b>tracked</>} />
        <p className="lede-sm">Track creators in your space. YouTube channels can import their latest 12 videos with live numbers. For Pinterest, add top pins by hand with the saves you can see.</p>
        {comps.failed && <p className="auth-err">Competitors couldn&apos;t load. {setupHint}</p>}
        {adding ? (
          <form className="pform" onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
              await addCompetitor({ name: String(f.get("name")).trim(), platform: String(f.get("platform")), handle: String(f.get("handle") || "").trim() || null, url: String(f.get("url") || "").trim() || null, notes: String(f.get("notes") || "").trim() || null });
              setAdding(false);
              toast("Competitor added.");
              comps.reload();
            } catch {
              toast(`That didn't save. ${setupHint}`);
            }
          }}>
            <label className="full">Name<input id="cp-name" name="name" placeholder="Creator or brand name" maxLength={60} required autoFocus /></label>
            <label>Platform<select id="cp-platform" name="platform">{["YouTube", "Pinterest", ...PLATFORMS.filter((p) => p !== "YouTube" && p !== "Pinterest")].map((p) => <option key={p}>{p}</option>)}</select></label>
            <label>Handle <small>(YouTube: @name)</small><input id="cp-handle" name="handle" placeholder="@creatorname" maxLength={80} /></label>
            <label className="full">Profile link <small>(optional)</small><input id="cp-url" name="url" placeholder="https://…" maxLength={300} /></label>
            <label className="full">What you like about them <small>(optional)</small><input id="cp-notes" name="notes" placeholder="Great thumbnails, strong hooks…" maxLength={300} /></label>
            <div className="form-actions full"><button type="button" className="btn ghost" onClick={() => setAdding(false)}>Cancel</button><button type="submit" className="btn">Add competitor</button></div>
          </form>
        ) : (
          <div className="card-foot start"><button type="button" className="btn" onClick={() => setAdding(true)}><Icon name="plus" strokeWidth={2.2} /> Add a competitor</button></div>
        )}
      </section>

      {list.map((c) => (
        <CompetitorCard key={c.id} c={c} posts={allPosts.filter((p) => p.competitor_id === c.id)} busy={busy === c.id}
          onImport={() => importLatest(c)}
          onDelete={async () => { try { await deleteCompetitor(c.id); toast("Competitor removed."); comps.reload(); posts.reload(); } catch { toast("That didn't delete. Try again."); } }}
          onAddPost={async (p) => { try { await addCompPost({ ...p, competitor_id: c.id }); toast("Post added."); posts.reload(); } catch { toast(`That didn't save. ${setupHint}`); } }}
          onDeletePost={async (id) => { try { await deleteCompPost(id); posts.reload(); } catch { toast("That didn't delete. Try again."); } }} />
      ))}
    </div>
  );
}

function CompetitorCard({ c, posts, busy, onImport, onDelete, onAddPost, onDeletePost }: {
  c: Competitor; posts: CompPost[]; busy: boolean; onImport: () => void; onDelete: () => void;
  onAddPost: (p: Omit<CompPost, "id" | "competitor_id">) => void; onDeletePost: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const withViews = posts.filter((p) => p.views != null);
  const avg = withViews.length ? withViews.reduce((a, p) => a + (p.views ?? 0), 0) / withViews.length : 0;
  const sorted = [...posts].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
  const pin = c.platform === "Pinterest";
  return (
    <section className="card" aria-label={c.name}>
      <div className="comp-head">
        <div>
          <h3 className="tpl-title">{c.name}</h3>
          <span className="muted small">{c.platform}{c.handle ? ` · ${c.handle}` : ""}{c.url ? <> · <a href={c.url} target="_blank" rel="noreferrer">profile</a></> : null}</span>
          {c.notes && <p className="cc-hook">“{c.notes}”</p>}
        </div>
        <div className="minis comp-minis">
          <div><small>Posts tracked</small><b>{posts.length}</b></div>
          <div><small>Avg {pin ? "impr." : "views"}</small><b>{withViews.length ? fmt(avg) : "–"}</b></div>
        </div>
      </div>
      <div className="card-foot wrap start">
        {c.platform === "YouTube" && <button type="button" className="btn sm" disabled={busy} onClick={onImport}>{busy ? "Importing…" : posts.length ? "Refresh from YouTube" : "Import latest videos"}</button>}
        <button type="button" className="btn ghost sm" onClick={() => setAdding((a) => !a)}>{adding ? "Close" : "Add a post by hand"}</button>
        <DeleteButton label={`Remove competitor ${c.name}`} text="Remove?" onConfirm={onDelete} />
      </div>
      {adding && (
        <form className="pform" onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          onAddPost({
            platform: c.platform, title: String(f.get("title")).trim(), url: String(f.get("url") || "").trim() || null,
            format: String(f.get("format")), pillar: String(f.get("pillar")), posted_day: String(f.get("day") || "") || null,
            views: toNum(f.get("views")), likes: toNum(f.get("likes")), comments: toNum(f.get("comments")), saves: toNum(f.get("saves")), clicks: null,
          });
          setAdding(false);
        }}>
          <label className="full">Title<input id={`cpp-title-${c.id}`} name="title" maxLength={200} required autoFocus /></label>
          <label className="full">Link <small>(optional)</small><input id={`cpp-url-${c.id}`} name="url" maxLength={300} /></label>
          <label>Format<select id={`cpp-format-${c.id}`} name="format" defaultValue={pin ? "Pin" : "Long video"}>{FORMATS.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label>Topic<select id={`cpp-pillar-${c.id}`} name="pillar">{PILLARS.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label>Posted<input id={`cpp-day-${c.id}`} name="day" type="date" /></label>
          <label>{pin ? "Impressions (if known)" : "Views"}<input id={`cpp-views-${c.id}`} name="views" inputMode="numeric" placeholder="12k" /></label>
          {pin ? <label>Saves<input id={`cpp-saves-${c.id}`} name="saves" inputMode="numeric" /></label> : <label>Likes<input id={`cpp-likes-${c.id}`} name="likes" inputMode="numeric" /></label>}
          {!pin && <label>Comments<input id={`cpp-comments-${c.id}`} name="comments" inputMode="numeric" /></label>}
          <div className="form-actions full"><button type="submit" className="btn sm">Add post</button></div>
        </form>
      )}
      {posts.length === 0 && !adding && <p className="empty">No posts tracked yet.</p>}
      {posts.length > 0 && (
        <div className="table-scroll">
          <table className="mini-table wide">
            <thead><tr><th scope="col">Post</th><th scope="col">{pin ? "Impr." : "Views"}</th><th scope="col">vs avg</th><th scope="col">Eng.</th><th scope="col"><span className="sr-only">Remove</span></th></tr></thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id} className={avg && (p.views ?? 0) / avg >= 1.5 ? "win" : ""}>
                  <th scope="row">{p.url ? <a href={p.url} target="_blank" rel="noreferrer">{p.title}</a> : p.title}<small>{[p.format, p.pillar, p.posted_day].filter(Boolean).join(" · ")}</small></th>
                  <td>{p.views != null ? fmt(p.views) : "–"}</td>
                  <td>{avg && p.views != null ? `${((p.views ?? 0) / avg).toFixed(1)}×` : "–"}</td>
                  <td>{pct(engagementOf(p, p.platform))}</td>
                  <td><DeleteButton label={`Remove ${p.title}`} text="Remove?" onConfirm={() => onDeletePost(p.id)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {posts.some((p) => !p.pillar) && <p className="hint-sm">Imported videos have no topic yet, so they count as “Other” in topic insights.</p>}
    </section>
  );
}

export type { Row };
