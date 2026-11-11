"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "../Icon";
import { AppShell, useShell } from "../shell/AppShell";
import { CardHeader } from "../home/CardHeader";
import { DeleteButton, MonthNav } from "../ui";
import {
  CONTENT_STATUSES, FORMATS, PILLARS, PLATFORMS, deleteContent, listContent, saveContent, updateContent, useRows,
  type ContentItem, type ContentStatus, type NewContent,
} from "@/lib/money";
import { MONTHS, WEEKDAYS, addDays, isoDate } from "@/lib/dates";
import { heartBurst } from "@/lib/hearts";

export function ContentScreen({ now }: { now: Date }) {
  return (
    <AppShell title="Content bank" crumb="Money & Grace Co.">
      <ContentBody now={now} />
    </AppShell>
  );
}

const fromIso = (s: string) => new Date(`${s}T12:00:00`);
const shortDate = (s: string) => {
  const d = fromIso(s);
  return `${WEEKDAYS[d.getDay()].slice(0, 3)}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
};
const fullText = (c: Pick<ContentItem, "hook" | "caption" | "hashtags">) => [c.hook, c.caption, c.hashtags].filter((x) => x && x.trim()).join("\n\n");

type Editing = { item?: ContentItem; day?: string } | null;

function ContentBody({ now }: { now: Date }) {
  const { toast } = useShell();
  const items = useRows(listContent, []);
  const [view, setView] = useState<"bank" | "calendar">("bank");
  const [editing, setEditing] = useState<Editing>(null);
  const [status, setStatus] = useState<ContentStatus | "All">("All");
  const [platform, setPlatform] = useState("All platforms");
  const [pillar, setPillar] = useState("All topics");
  const [query, setQuery] = useState("");
  const today = isoDate(now);

  const list = items.data ?? [];
  const weekEnd = isoDate(addDays(now, 6));
  const monthPrefix = today.slice(0, 7);
  const counts = {
    ideas: list.filter((c) => c.status === "Idea").length,
    drafted: list.filter((c) => c.status === "Drafted").length,
    week: list.filter((c) => c.status === "Scheduled" && c.post_day && c.post_day >= today && c.post_day <= weekEnd).length,
    posted: list.filter((c) => c.status === "Posted" && c.post_day?.startsWith(monthPrefix)).length,
  };

  async function run(fn: () => Promise<void>, ok: string) {
    try {
      await fn();
      if (ok) toast(ok);
    } catch {
      toast("That didn't save. Check your internet connection and try again. If this is your first time here, run supabase/phase6.sql in Supabase.");
    }
    items.reload();
  }

  function setItemStatus(c: ContentItem, s: ContentStatus) {
    const patch: Partial<NewContent> = { status: s };
    if (s === "Posted" && !c.post_day) patch.post_day = today;
    items.setData(list.map((x) => (x.id === c.id ? { ...x, ...patch } : x)));
    run(() => updateContent(c.id, patch), s === "Posted" ? "Posted! Another one out in the world." : "");
  }

  async function copy(c: ContentItem) {
    const text = fullText(c);
    if (!text) return toast("This idea has no hook or caption yet.");
    try {
      await navigator.clipboard.writeText(text);
      toast("Caption copied. Paste it into your app.");
    } catch {
      toast("Copying didn't work here. Open the idea and select the caption to copy it.");
    }
  }

  const q = query.trim().toLowerCase();
  const shown = list.filter(
    (c) =>
      (status === "All" || c.status === status) &&
      (platform === "All platforms" || c.platform === platform) &&
      (pillar === "All topics" || c.pillar === pillar) &&
      (!q || [c.title, c.hook, c.caption, c.hashtags].some((x) => x?.toLowerCase().includes(q))),
  );

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow"><Link href="/business">Money &amp; Grace Co.</Link></span>
          <h2 className="page-title biz-title">Content bank</h2>
        </div>
        <div className="cal-ctrls">
          <div className="seg" role="tablist" aria-label="View">
            <button type="button" role="tab" aria-selected={view === "bank"} className={view === "bank" ? "on" : ""} onClick={() => setView("bank")}>Ideas</button>
            <button type="button" role="tab" aria-selected={view === "calendar"} className={view === "calendar" ? "on" : ""} onClick={() => setView("calendar")}>Calendar</button>
          </div>
          <button type="button" className="btn" onClick={() => setEditing({})}><Icon name="plus" strokeWidth={2.2} /> New idea</button>
        </div>
      </div>

      {items.failed && <p className="auth-err">Your content bank couldn&apos;t load. Check your internet connection, then refresh. If this is your first time here, run <b>supabase/phase6.sql</b> in Supabase.</p>}

      <div className="stats money-stats">
        <div className="stat"><small>Ideas</small><b>{counts.ideas}</b></div>
        <div className="stat"><small>Drafted</small><b>{counts.drafted}</b></div>
        <div className="stat"><small>Scheduled this week</small><b>{counts.week}</b></div>
        <div className="stat hl"><small>Posted in {MONTHS[now.getMonth()]}</small><b>{counts.posted}</b></div>
      </div>

      {view === "bank" ? (
        <section className="card" aria-labelledby="h-bank">
          <CardHeader id="h-bank" icon="sparkle" eyebrow="Save every idea" title="Ideas & captions" meta={<><b>{shown.length}</b>shown</>} />
          <div className="content-filters">
            <div className="chipset-row" role="group" aria-label="Status">
              {(["All", ...CONTENT_STATUSES] as const).map((s) => (
                <button key={s} type="button" className={`fchip${status === s ? " on" : ""}`} aria-pressed={status === s} onClick={() => setStatus(s)}>{s}</button>
              ))}
            </div>
            <div className="filter-row">
              <label className="sr-only" htmlFor="cf-platform">Platform</label>
              <select id="cf-platform" value={platform} onChange={(e) => setPlatform(e.currentTarget.value)}>
                {["All platforms", ...PLATFORMS].map((p) => <option key={p}>{p}</option>)}
              </select>
              <label className="sr-only" htmlFor="cf-pillar">Topic</label>
              <select id="cf-pillar" value={pillar} onChange={(e) => setPillar(e.currentTarget.value)}>
                {["All topics", ...PILLARS].map((p) => <option key={p}>{p}</option>)}
              </select>
              <label className="sr-only" htmlFor="cf-search">Search</label>
              <input id="cf-search" type="search" placeholder="Search hooks & captions" value={query} onChange={(e) => setQuery(e.currentTarget.value)} />
            </div>
          </div>

          {items.data && list.length === 0 && (
            <div className="empty-start">
              <p className="empty">Your content bank is empty. Save every idea here, even half-formed ones, then draft, schedule and post them.</p>
              <button type="button" className="btn" onClick={() => setEditing({})}>Save your first idea</button>
            </div>
          )}
          {items.data && list.length > 0 && shown.length === 0 && <p className="empty">No ideas match these filters.</p>}

          <div className="content-grid">
            {shown.map((c) => (
              <article className={`content-card s-${c.status.toLowerCase()}`} key={c.id}>
                <div className="cc-top">
                  <span className="tag-pill">{c.platform} · {c.format}</span>
                  <label className="sr-only" htmlFor={`cs-${c.id}`}>Status of {c.title}</label>
                  <select id={`cs-${c.id}`} className={`status-sel s-${c.status.toLowerCase()}`} value={c.status}
                    onChange={(e) => {
                      const s = e.currentTarget.value as ContentStatus;
                      if (s === "Posted") heartBurst(e.currentTarget);
                      setItemStatus(c, s);
                    }}>
                    {CONTENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <button type="button" className="cc-open" onClick={() => setEditing({ item: c })}>
                  <h3>{c.title}</h3>
                  {c.hook && <p className="cc-hook">“{c.hook}”</p>}
                  {!c.hook && c.caption && <p className="cc-cap">{c.caption.slice(0, 120)}{c.caption.length > 120 ? "…" : ""}</p>}
                </button>
                <div className="cc-foot">
                  <span className="muted">{c.pillar}</span>
                  <span className={c.post_day && c.post_day < today && c.status !== "Posted" ? "overdue" : "muted"}>
                    {c.post_day ? shortDate(c.post_day) : "No date yet"}
                  </span>
                </div>
                <div className="cc-actions">
                  <button type="button" className="btn ghost sm" onClick={() => copy(c)}>Copy caption</button>
                  <button type="button" className="btn ghost sm" onClick={() => setEditing({ item: c })}>Edit</button>
                  <DeleteButton label={`Delete idea ${c.title}`} onConfirm={() => run(() => deleteContent(c.id), "Idea deleted.")} />
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <ContentCalendar now={now} items={list} onOpen={(item) => setEditing({ item })} onAdd={(day) => setEditing({ day })}
          onSchedule={(c, day) => {
            const patch: Partial<NewContent> = { post_day: day, status: c.status === "Posted" ? "Posted" : "Scheduled" };
            items.setData(list.map((x) => (x.id === c.id ? { ...x, ...patch } : x)));
            run(() => updateContent(c.id, patch), `Scheduled for ${shortDate(day)}.`);
          }} />
      )}

      {editing && (
        <ContentEditor
          key={editing.item?.id ?? `new-${editing.day ?? ""}`}
          item={editing.item}
          day={editing.day}
          onClose={() => setEditing(null)}
          onCopy={copy}
          onSave={(c) => {
            setEditing(null);
            run(() => saveContent(c, editing.item?.id), editing.item ? "Idea saved." : "Idea added to your content bank.");
          }}
        />
      )}
    </>
  );
}

function ContentEditor({ item, day, onClose, onSave, onCopy }: {
  item?: ContentItem; day?: string; onClose: () => void; onSave: (c: NewContent) => void; onCopy: (c: ContentItem) => void;
}) {
  const [caption, setCaption] = useState(item?.caption ?? "");
  return (
    <div className="sheet-wrap" role="dialog" aria-modal="true" aria-labelledby="ce-title">
      <div className="scrim" onClick={onClose} />
      <div className="sheet wide">
        <div className="sheet-h">
          <h2 id="ce-title">{item ? "Edit idea" : "New idea"}</h2>
          <button type="button" className="iconbtn" aria-label="Close" onClick={onClose}><Icon name="x" /></button>
        </div>
        <form className="pform" onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const val = (k: string) => String(f.get(k) ?? "").trim() || null;
          const post_day = val("post_day");
          let status = String(f.get("status")) as ContentStatus;
          if (post_day && status === "Idea" && !item) status = "Scheduled";
          onSave({
            title: String(f.get("title")).trim(),
            platform: String(f.get("platform")),
            format: String(f.get("format")),
            pillar: String(f.get("pillar")),
            status,
            hook: val("hook"),
            caption: caption.trim() || null,
            hashtags: val("hashtags"),
            post_day,
          });
        }}>
          <label className="full">Idea<input id="ce-title-in" name="title" defaultValue={item?.title} placeholder="3 signs you're ready to start your debt snowball" maxLength={200} required autoFocus /></label>
          <label>Platform<select id="ce-platform" name="platform" defaultValue={item?.platform ?? "Instagram"}>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select></label>
          <label>Format<select id="ce-format" name="format" defaultValue={item?.format ?? "Reel"}>{FORMATS.map((p) => <option key={p}>{p}</option>)}</select></label>
          <label>Topic<select id="ce-pillar" name="pillar" defaultValue={item?.pillar ?? "Debt payoff tips"}>{PILLARS.map((p) => <option key={p}>{p}</option>)}</select></label>
          <label>Status<select id="ce-status" name="status" defaultValue={item?.status ?? (day ? "Scheduled" : "Idea")}>{CONTENT_STATUSES.map((p) => <option key={p}>{p}</option>)}</select></label>
          <label className="full">Post date <small>(optional)</small><input id="ce-day" name="post_day" type="date" defaultValue={item?.post_day ?? day ?? ""} /></label>
          <label className="full">Hook <small>(the first line that stops the scroll)</small><input id="ce-hook" name="hook" defaultValue={item?.hook ?? ""} placeholder="I paid off $18,000 without a raise. Here's how." maxLength={300} /></label>
          <label className="full">Caption <small>{caption.length ? `${caption.length.toLocaleString("en-US")} characters` : ""}</small>
            <textarea id="ce-caption" name="caption" rows={7} value={caption} onChange={(e) => setCaption(e.currentTarget.value)} maxLength={5000}
              placeholder="Write the caption, script or email here…" />
          </label>
          <label className="full">Hashtags <small>(optional)</small><input id="ce-tags" name="hashtags" defaultValue={item?.hashtags ?? ""} placeholder="#debtfree #debtfreejourney #budgeting" maxLength={500} /></label>
          <div className="form-actions full">
            {item && <button type="button" className="btn ghost" onClick={() => onCopy({ ...item, caption })}>Copy caption</button>}
            <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn">{item ? "Save" : "Add idea"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContentCalendar({ now, items, onOpen, onAdd, onSchedule }: {
  now: Date; items: ContentItem[]; onOpen: (c: ContentItem) => void; onAdd: (day: string) => void; onSchedule: (c: ContentItem, day: string) => void;
}) {
  const today = isoDate(now);
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selected, setSelected] = useState(today);
  const start = addDays(month, -month.getDay());
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const byDay = new Map<string, ContentItem[]>();
  for (const c of items) if (c.post_day) byDay.set(c.post_day, [...(byDay.get(c.post_day) ?? []), c]);
  const dayItems = byDay.get(selected) ?? [];
  const unscheduled = items.filter((c) => !c.post_day && c.status !== "Posted");
  const sel = fromIso(selected);

  return (
    <div className="split cal-split">
      <section className="card cal-card" aria-label="Content calendar">
        <div className="cal-head-row">
          <MonthNav month={month} current={now} onChange={(d) => { setMonth(d); setSelected(isoDate(d)); }} />
        </div>
        <div className="cal-grid month">
          {WEEKDAYS.map((w) => <span key={w} className="cal-dn">{w.slice(0, 3)}</span>)}
          {days.map((d) => {
            const key = isoDate(d);
            const evs = byDay.get(key) ?? [];
            const cls = ["cal-cell", d.getMonth() !== month.getMonth() && "out", key === today && "today", key === selected && "sel"].filter(Boolean).join(" ");
            return (
              <button type="button" key={key} className={cls} onClick={() => setSelected(key)}
                aria-label={`${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}: ${evs.length} ${evs.length === 1 ? "post" : "posts"}`}>
                <span className="cal-num">{d.getDate()}</span>
                <span className="cal-evs">
                  {evs.slice(0, 2).map((c) => <span key={c.id} className={`cal-ev post s-${c.status.toLowerCase()}`} title={`${c.platform}: ${c.title}`}>{c.title}</span>)}
                  {evs.length > 2 && <span className="cal-more">+{evs.length - 2} more</span>}
                </span>
                {evs.length > 0 && <span className="cal-dots" aria-hidden="true">{evs.slice(0, 3).map((c) => <i key={c.id} className={`s-${c.status.toLowerCase()}`} />)}</span>}
              </button>
            );
          })}
        </div>
        <div className="heat-legend" aria-hidden="true">
          {CONTENT_STATUSES.map((s) => <span key={s} className="lg"><i className={`dot s-${s.toLowerCase()}`} />{s}</span>)}
        </div>
      </section>

      <div className="stack">
        <section className="card" aria-labelledby="h-cday">
          <header className="card-h">
            <div className="dtile big"><small>{MONTHS[sel.getMonth()].slice(0, 3)}</small><b>{sel.getDate()}</b></div>
            <div>
              <span className="eyebrow">{selected === today ? "Today" : WEEKDAYS[sel.getDay()]}</span>
              <h2 id="h-cday">{dayItems.length ? `${dayItems.length} ${dayItems.length === 1 ? "post" : "posts"}` : "Nothing planned"}</h2>
            </div>
            <button type="button" className="btn sm add-ev" onClick={() => onAdd(selected)}><Icon name="plus" strokeWidth={2.2} />Add</button>
          </header>
          <ul className="txn-list">
            {dayItems.map((c) => (
              <li key={c.id}>
                <button type="button" className="ev-open" onClick={() => onOpen(c)}>
                  <b>{c.title}</b>
                  <span>{c.platform} · {c.format} · {c.status}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card" aria-labelledby="h-unsched">
          <CardHeader id="h-unsched" icon="star" eyebrow="Ready when you are" title="Not scheduled yet" meta={<><b>{unscheduled.length}</b>ideas</>} />
          {unscheduled.length === 0 && <p className="empty">Every idea has a date. Nice planning!</p>}
          <ul className="txn-list">
            {unscheduled.slice(0, 12).map((c) => (
              <li key={c.id}>
                <button type="button" className="ev-open" onClick={() => onOpen(c)}>
                  <b>{c.title}</b>
                  <span>{c.platform} · {c.status}</span>
                </button>
                <button type="button" className="btn ghost sm" onClick={() => onSchedule(c, selected)}>
                  Put on {MONTHS[sel.getMonth()].slice(0, 3)} {sel.getDate()}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
