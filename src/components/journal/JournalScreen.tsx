"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import { Bow } from "../Ornaments";
import { AppShell, useShell } from "../shell/AppShell";
import { CardHeader } from "../home/CardHeader";
import { getJournal, listJournal, photoUrls, removePhoto, saveJournal, uploadPhoto, type JournalEntry } from "@/lib/data";
import { MONTHS, WEEKDAYS, addDays, isoDate } from "@/lib/dates";
import { heartBurst } from "@/lib/hearts";

const PROMPTS = [
  "What made you smile today?",
  "What is one thing you did today that future you will thank you for?",
  "Where did you feel most like yourself today?",
  "What are you ready to let go of?",
  "Describe a small, lovely moment from today in detail.",
  "What would make tomorrow feel soft and successful?",
  "What did you learn about money, or yourself, today?",
  "Who are you becoming? Write to her.",
  "What boundary did you keep, or wish you had kept?",
  "What are you proud of that nobody else saw?",
];
const MAX_PHOTOS = 6;

const fromIso = (s: string) => new Date(`${s}T12:00:00`);
const longDate = (s: string) => {
  const d = fromIso(s);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
};
const empty = (day: string): JournalEntry => ({ day, body: "", gratitude: ["", "", ""], photos: [] });

export function JournalScreen({ now }: { now: Date }) {
  return (
    <AppShell title="Journal" crumb="Dear diary">
      <JournalBody now={now} />
    </AppShell>
  );
}

type SaveState = "idle" | "saving" | "saved" | "error";

function JournalBody({ now }: { now: Date }) {
  const { toast } = useShell();
  const today = isoDate(now);
  const [day, setDay] = useState(today);
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [failed, setFailed] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(0);
  const [past, setPast] = useState<JournalEntry[] | null>(null);
  const [pastVersion, setPastVersion] = useState(0);
  const [confirmPhoto, setConfirmPhoto] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef<JournalEntry | null>(null);

  // Load the selected day's entry.
  useEffect(() => {
    let live = true;
    getJournal(day)
      .then((e) => {
        if (!live) return;
        const loaded = e ? { ...e, gratitude: [0, 1, 2].map((i) => e.gratitude?.[i] ?? "") } : empty(day);
        latest.current = loaded;
        setEntry(loaded);
        setFailed(false);
        setSaveState("idle");
        return photoUrls(loaded.photos).then((u) => live && setUrls(u));
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [day]);

  // Recent entries list.
  useEffect(() => {
    let live = true;
    listJournal(30)
      .then((rows) => live && setPast(rows))
      .catch(() => live && setPast([]));
    return () => {
      live = false;
    };
  }, [pastVersion]);

  // Save right away when leaving the page with unsaved typing.
  useEffect(() => () => {
    if (timer.current && latest.current) {
      clearTimeout(timer.current);
      saveJournal(latest.current).catch(() => {});
    }
  }, []);

  async function persist(e: JournalEntry) {
    setSaveState("saving");
    try {
      await saveJournal(e);
      setSaveState("saved");
      setPastVersion((v) => v + 1);
    } catch {
      setSaveState("error");
    }
  }

  function change(patch: Partial<JournalEntry>, immediate = false) {
    if (!entry) return;
    const next = { ...entry, ...patch };
    setEntry(next);
    latest.current = next;
    clearTimeout(timer.current);
    if (immediate) {
      timer.current = undefined;
      persist(next);
    } else {
      setSaveState("saving");
      timer.current = setTimeout(() => {
        timer.current = undefined;
        persist(next);
      }, 900);
    }
  }

  function go(nextDay: string) {
    if (timer.current && latest.current) {
      clearTimeout(timer.current);
      timer.current = undefined;
      persist(latest.current);
    }
    setEntry(null);
    setUrls({});
    setDay(nextDay);
  }

  async function addPhotos(files: FileList | null) {
    if (!files || !entry) return;
    const room = MAX_PHOTOS - entry.photos.length;
    const picked = Array.from(files).slice(0, room);
    if (files.length > room) toast(`A day holds up to ${MAX_PHOTOS} photos, so only ${room} ${room === 1 ? "was" : "were"} added.`);
    setUploading(picked.length);
    const added: string[] = [];
    for (const f of picked) {
      try {
        added.push(await uploadPhoto(f, day));
      } catch {
        toast("A photo didn't upload. Try a JPEG or PNG, and check your internet connection.");
      }
      setUploading((n) => n - 1);
    }
    if (added.length) {
      const photos = [...(latest.current?.photos ?? entry.photos), ...added];
      change({ photos }, true);
      photoUrls(added).then((u) => setUrls((old) => ({ ...old, ...u }))).catch(() => {});
      toast(added.length === 1 ? "Photo added." : `${added.length} photos added.`);
    }
  }

  async function deletePhoto(path: string) {
    if (confirmPhoto !== path) {
      setConfirmPhoto(path);
      return;
    }
    setConfirmPhoto(null);
    if (!entry) return;
    change({ photos: entry.photos.filter((p) => p !== path) }, true);
    removePhoto(path).catch(() => toast("The photo file couldn't be deleted. It's hidden from your journal."));
  }

  const dayIdx = Math.floor(fromIso(day).getTime() / 864e5);
  const prompt = PROMPTS[((dayIdx % PROMPTS.length) + PROMPTS.length) % PROMPTS.length];
  const words = entry?.body.trim() ? entry.body.trim().split(/\s+/).length : 0;

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">{day === today ? "Today" : "Looking back"}</span>
          <h2 className="page-title">{longDate(day)}</h2>
        </div>
        <div className="cal-ctrls">
          <button type="button" className="iconbtn round" aria-label="Previous day" onClick={() => go(isoDate(addDays(fromIso(day), -1)))}>‹</button>
          <button type="button" className="btn ghost sm" onClick={() => go(today)} disabled={day === today}>Today</button>
          <button type="button" className="iconbtn round" aria-label="Next day" disabled={day >= today} onClick={() => go(isoDate(addDays(fromIso(day), 1)))}>›</button>
        </div>
      </div>

      {failed && <p className="auth-err">Your journal couldn&apos;t load. Check your internet connection, then refresh. If this is your first time here, run <b>supabase/phase3.sql</b> in Supabase.</p>}

      <div className="split">
        <div className="stack">
          <section className="card journal-card" aria-labelledby="h-journal">
            <Bow className="orn" style={{ width: 62, right: 22, top: -18 }} />
            <CardHeader id="h-journal" icon="journal" eyebrow="Dear diary" title="Today's page"
              meta={<span className={`saved ${saveState}`}>{saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Not saved, check your connection" : `${words} ${words === 1 ? "word" : "words"}`}</span>} />
            <p className="prompt">{prompt}</p>
            {entry ? (
              <>
                <label htmlFor="journalBody" className="sr-only">Journal entry</label>
                <textarea id="journalBody" className="journal-body" value={entry.body} placeholder="Start writing… it saves as you type."
                  onChange={(e) => change({ body: e.currentTarget.value })} rows={12} maxLength={20000} />
              </>
            ) : (
              !failed && <p className="empty">Opening your page…</p>
            )}
          </section>

          {entry && (
            <section className="card" aria-labelledby="h-grat">
              <CardHeader id="h-grat" icon="heart" eyebrow="Three good things" title="Gratitude" />
              <div className="grat">
                {entry.gratitude.map((g, i) => (
                  <label key={i} className="grat-line">
                    <span className="grat-num">{i + 1}</span>
                    <input id={`grat-${i}`} value={g} maxLength={200} placeholder={["I'm grateful for…", "Someone who made today better…", "A small luxury I enjoyed…"][i]}
                      onChange={(e) => change({ gratitude: entry.gratitude.map((x, j) => (j === i ? e.currentTarget.value : x)) })}
                      onBlur={(e) => e.currentTarget.value.trim() && i === 2 && entry.gratitude.every((x) => x.trim()) && heartBurst(e.currentTarget)} />
                  </label>
                ))}
              </div>
            </section>
          )}

          {entry && (
            <section className="card" aria-labelledby="h-photos">
              <CardHeader id="h-photos" icon="sparkle" eyebrow="Memories" title="Photos" meta={<><b>{entry.photos.length}</b>of {MAX_PHOTOS}</>} />
              <div className="photo-grid">
                {entry.photos.map((p) => (
                  <figure key={p} className="photo">
                    {urls[p] ? (
                      // eslint-disable-next-line @next/next/no-img-element -- private, short-lived signed links
                      <img src={urls[p]} alt="Journal photo" loading="lazy" />
                    ) : (
                      <span className="photo-ph">Loading…</span>
                    )}
                    <button type="button" className={`iconbtn del photo-del${confirmPhoto === p ? " confirm" : ""}`} aria-label="Delete photo" onBlur={() => setConfirmPhoto(null)} onClick={() => deletePhoto(p)}>
                      {confirmPhoto === p ? "Delete?" : <Icon name="x" />}
                    </button>
                  </figure>
                ))}
                {Array.from({ length: uploading }, (_, i) => <div key={`u${i}`} className="photo"><span className="photo-ph">Uploading…</span></div>)}
                {entry.photos.length + uploading < MAX_PHOTOS && (
                  <label className="photo add-photo">
                    <Icon name="plus" />
                    <span>Add photos</span>
                    <input id="photoInput" type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { addPhotos(e.currentTarget.files); e.currentTarget.value = ""; }} />
                  </label>
                )}
              </div>
              <p className="hint-sm">Photos are stored privately. Only you can see them, after logging in with your code.</p>
            </section>
          )}
        </div>

        <section className="card" aria-labelledby="h-past">
          <CardHeader id="h-past" icon="calendar" eyebrow="Your story" title="Past entries" />
          {past === null && <p className="empty">Loading…</p>}
          {past?.length === 0 && <p className="empty">Your entries will collect here, newest first.</p>}
          <ul className="past-list">
            {past?.filter((p) => p.body.trim() || p.gratitude.some((g) => g?.trim()) || p.photos.length).map((p) => (
              <li key={p.day}>
                <button type="button" className={p.day === day ? "on" : ""} onClick={() => go(p.day)}>
                  <span className="dtile"><small>{MONTHS[fromIso(p.day).getMonth()].slice(0, 3)}</small><b>{fromIso(p.day).getDate()}</b></span>
                  <span className="past-txt">
                    <b>{WEEKDAYS[fromIso(p.day).getDay()]}</b>
                    <span>{p.body.trim().slice(0, 90) || p.gratitude.find((g) => g?.trim()) || "Photos only"}{p.body.trim().length > 90 ? "…" : ""}</span>
                  </span>
                  {p.photos.length > 0 && <span className="tag-pill">{p.photos.length} {p.photos.length === 1 ? "photo" : "photos"}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
