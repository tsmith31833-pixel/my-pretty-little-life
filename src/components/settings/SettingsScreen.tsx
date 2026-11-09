"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, useShell, type Theme } from "../shell/AppShell";
import { CardHeader } from "../home/CardHeader";
import { DEFAULT_PROFILE, saveProfile, useProfile, type Profile } from "@/lib/settings";
import { downloadEverything, downloadSpendingCsv } from "@/lib/export";
import { supabase } from "@/lib/supabase/client";
import { MONTHS } from "@/lib/dates";

const REPO = "https://github.com/tsmith31833-pixel/my-pretty-little-life";
const LAST_EXPORT_KEY = "mpll-last-export";

export function SettingsScreen({ now }: { now: Date }) {
  return (
    <AppShell title="Settings" crumb="Make it yours">
      <SettingsBody now={now} />
    </AppShell>
  );
}

function SettingsBody({ now }: { now: Date }) {
  const loaded = useProfile();
  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Settings</span>
          <h2 className="page-title">Make it yours</h2>
        </div>
      </div>
      <div className="sgrid">
        {loaded ? <ProfileCard initial={loaded} /> : <section className="card"><p className="empty">Loading your profile…</p></section>}
        <AppearanceCard />
        <SecurityCard />
        <DataCard now={now} />
        <BackupsCard />
      </div>
    </>
  );
}

function ProfileCard({ initial }: { initial: Profile }) {
  const { toast } = useShell();
  const [busy, setBusy] = useState(false);
  return (
    <section className="card" aria-labelledby="h-profile">
      <CardHeader id="h-profile" icon="heart" eyebrow="About you" title="Profile & goals" />
      <form className="pform" onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const p: Profile = {
          name: String(f.get("name")).trim() || DEFAULT_PROFILE.name,
          sleepGoalHours: Math.min(12, Math.max(4, Number(f.get("sleep")) || 8)),
          stepGoal: Math.min(50000, Math.max(1000, Math.round(Number(String(f.get("steps")).replace(/[^\d]/g, "")) || 8000))),
        };
        setBusy(true);
        try {
          await saveProfile(p);
          toast("Saved. Your Today page will greet you by this name.");
        } catch {
          toast("Your profile didn't save. If this is your first time here, run supabase/phase5.sql in Supabase.");
        }
        setBusy(false);
      }}>
        <label className="full">Greeting name <small>(Today says “Hello, …”)</small>
          <input id="profile-name" name="name" defaultValue={initial.name} maxLength={40} />
        </label>
        <label>Sleep goal (hours)<input id="profile-sleep" name="sleep" type="number" min={4} max={12} step={0.5} defaultValue={initial.sleepGoalHours} /></label>
        <label>Daily step goal<input id="profile-steps" name="steps" inputMode="numeric" defaultValue={initial.stepGoal} /></label>
        <div className="form-actions full"><button type="submit" className="btn" disabled={busy}>{busy ? "Saving…" : "Save"}</button></div>
      </form>
    </section>
  );
}

function AppearanceCard() {
  const { theme, setTheme } = useShell();
  const options: [Theme, string][] = [["light", "Blush daylight"], ["dark", "Midnight rose"], ["system", "Match my device"]];
  return (
    <section className="card" aria-labelledby="h-look">
      <CardHeader id="h-look" icon="sparkle" eyebrow="Look & feel" title="Appearance" />
      <div className="seg big" role="radiogroup" aria-label="Theme">
        {options.map(([t, label]) => (
          <button key={t} type="button" role="radio" aria-checked={theme === t} className={theme === t ? "on" : ""} onClick={() => setTheme(t)}>{label}</button>
        ))}
      </div>
      <p className="hint-sm">“Match my device” follows your iPhone, iPad or laptop’s light and dark setting. This choice is saved on each device separately.</p>
    </section>
  );
}

function SecurityCard() {
  const { toast } = useShell();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [twoStep, setTwoStep] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmAll, setConfirmAll] = useState(false);

  useEffect(() => {
    let live = true;
    const auth = supabase().auth;
    auth.getUser().then(({ data }) => live && setEmail(data.user?.email ?? null));
    auth.mfa.listFactors().then(({ data }) => live && setTwoStep(!!data?.totp.some((f) => f.status === "verified")));
    return () => {
      live = false;
    };
  }, []);

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const pw = String(f.get("pw"));
    if (pw.length < 10) return setError("Use at least 10 characters.");
    if (pw !== String(f.get("pw2"))) return setError("The two passwords don't match.");
    setBusy(true);
    setError("");
    const { error } = await supabase().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setError("The password didn't change. Try a longer one, or check your internet connection.");
    form.reset();
    toast("Password changed. Update it in Apple Passwords too.");
  }

  async function signOut(scope: "local" | "global") {
    if (scope === "global" && !confirmAll) return setConfirmAll(true);
    await supabase().auth.signOut({ scope });
    router.replace("/login");
  }

  return (
    <section className="card" aria-labelledby="h-sec">
      <CardHeader id="h-sec" icon="lock" eyebrow="Privacy" title="Security" />
      <dl className="kv">
        <div><dt>Signed in as</dt><dd>{email ?? "…"}</dd></div>
        <div><dt>Two-step login</dt><dd>{twoStep === null ? "…" : twoStep ? <span className="ok">On · authenticator app</span> : <span className="overdue">Off</span>}</dd></div>
        <div><dt>New sign-ups</dt><dd>Turned off in Supabase. Only you can log in.</dd></div>
      </dl>
      <form className="pform" onSubmit={changePassword}>
        <label>New password<input id="pw" name="pw" type="password" autoComplete="new-password" minLength={10} required /></label>
        <label>Type it again<input id="pw2" name="pw2" type="password" autoComplete="new-password" minLength={10} required /></label>
        {error && <p className="auth-err full" role="alert">{error}</p>}
        <div className="form-actions full"><button type="submit" className="btn ghost" disabled={busy}>{busy ? "Changing…" : "Change password"}</button></div>
      </form>
      <div className="card-foot wrap">
        <button type="button" className="btn ghost sm" onClick={() => signOut("local")}>Sign out of this device</button>
        <button type="button" className={`btn sm${confirmAll ? " danger" : " ghost"}`} onBlur={() => setConfirmAll(false)} onClick={() => signOut("global")}>
          {confirmAll ? "Tap again to sign out everywhere" : "Sign out everywhere"}
        </button>
      </div>
      <p className="hint-sm">Lost your phone? Use “Sign out everywhere” from another device, then change your password.</p>
    </section>
  );
}

function DataCard({ now }: { now: Date }) {
  const { toast } = useShell();
  const [busy, setBusy] = useState<"" | "json" | "csv">("");
  const [last, setLast] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LAST_EXPORT_KEY);
    } catch {
      return null;
    }
  });

  async function run(kind: "json" | "csv") {
    setBusy(kind);
    try {
      const n = kind === "json" ? await downloadEverything() : await downloadSpendingCsv();
      const today = now.toISOString().slice(0, 10);
      if (kind === "json") {
        try {
          localStorage.setItem(LAST_EXPORT_KEY, today);
        } catch {}
        setLast(today);
      }
      toast(`Downloaded ${n.toLocaleString("en-US")} ${n === 1 ? "entry" : "entries"}.`);
    } catch {
      toast("The download didn't work. Check your internet connection and try again.");
    }
    setBusy("");
  }

  const lastLabel = last ? (() => { const d = new Date(`${last}T12:00:00`); return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; })() : null;
  return (
    <section className="card" aria-labelledby="h-data">
      <CardHeader id="h-data" icon="star" eyebrow="It's yours" title="Download my data" />
      <p className="lede-sm">Save a copy of everything you&apos;ve entered: daily pages, habits, calendar, to-dos, goals, wellness, journal text, money, business and home. Once a month, save it to iCloud Drive.</p>
      <div className="card-foot wrap start">
        <button type="button" className="btn" disabled={!!busy} onClick={() => run("json")}>{busy === "json" ? "Preparing…" : "Download everything"}</button>
        <button type="button" className="btn ghost" disabled={!!busy} onClick={() => run("csv")}>{busy === "csv" ? "Preparing…" : "Spending spreadsheet (CSV)"}</button>
      </div>
      <p className="hint-sm">{lastLabel ? `Last full download on this device: ${lastLabel}.` : "No full download from this device yet."} Journal photos are kept in the weekly photo backup instead.</p>
    </section>
  );
}

function BackupsCard() {
  return (
    <section className="card" aria-labelledby="h-backups">
      <CardHeader id="h-backups" icon="calendar" eyebrow="Safety net" title="Automatic backups" />
      <ul className="backup-list">
        <li><b>Every night</b><span>All your entries, encrypted, kept 30 days</span></li>
        <li><b>Every Sunday</b><span>Journal photos, encrypted, kept 15 days</span></li>
        <li><b>Every 3 months</b><span>A restore test proves the backups really open</span></li>
      </ul>
      <p className="hint-sm">Check that they&apos;re running in GitHub. A green check means it worked.</p>
      <a className="btn ghost sm link-btn" href={`${REPO}/actions`} target="_blank" rel="noreferrer">Open backup history in GitHub</a>
    </section>
  );
}
