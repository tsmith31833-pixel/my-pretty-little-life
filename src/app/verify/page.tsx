"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { supabase } from "@/lib/supabase/client";

// Step two of login. The first time, it shows a QR code to add the planner to
// your authenticator app. After that, it just asks for the 6-digit code.

type Setup =
  | { kind: "loading" }
  | { kind: "verify"; factorId: string }
  | { kind: "enroll"; factorId: string; qr: string; secret: string }
  | { kind: "error"; message: string };

async function prepare(): Promise<Setup> {
  const mfa = supabase().auth.mfa;
  const { data, error } = await mfa.listFactors();
  if (error) return { kind: "error", message: "Couldn't reach your account. Check your internet connection and refresh." };

  const verified = data.totp.find((f) => f.status === "verified");
  if (verified) return { kind: "verify", factorId: verified.id };

  // Clear out any half-finished setup before starting a fresh one.
  for (const f of data.all.filter((f) => f.status === "unverified")) {
    await mfa.unenroll({ factorId: f.id });
  }
  const enrolled = await mfa.enroll({ factorType: "totp", friendlyName: "My Pretty Little Life" });
  if (enrolled.error) return { kind: "error", message: "Couldn't start the authenticator setup. Refresh the page to try again." };
  return { kind: "enroll", factorId: enrolled.data.id, qr: enrolled.data.totp.qr_code, secret: enrolled.data.totp.secret };
}

export default function VerifyPage() {
  const [setup, setSetup] = useState<Setup>({ kind: "loading" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let live = true;
    prepare().then((s) => live && setSetup(s));
    return () => {
      live = false;
    };
  }, []);

  async function verify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (setup.kind !== "verify" && setup.kind !== "enroll") return;
    const code = String(new FormData(e.currentTarget).get("code")).replace(/\s/g, "");
    setBusy(true);
    setError("");
    const { error } = await supabase().auth.mfa.challengeAndVerify({ factorId: setup.factorId, code });
    if (error) {
      setBusy(false);
      setError("That code didn't work. Codes change every 30 seconds, so enter the newest one.");
      return;
    }
    router.replace("/");
  }

  async function signOut() {
    await supabase().auth.signOut();
    router.replace("/login");
  }

  const subtitle =
    setup.kind === "enroll"
      ? "One-time setup: connect your authenticator app."
      : "Enter the 6-digit code from your authenticator app.";

  return (
    <AuthCard title="Just one more step" subtitle={subtitle}>
      {setup.kind === "loading" && <p className="sub">Getting things ready…</p>}
      {setup.kind === "error" && <p className="auth-err" role="alert">{setup.message}</p>}

      {setup.kind === "enroll" && (
        <>
          <ol className="steps-list">
            <li>Open Apple Passwords, Google Authenticator or Microsoft Authenticator.</li>
            <li>Add a new code and scan this QR code.</li>
            <li>Type the 6-digit code it shows below.</li>
          </ol>
          {/* eslint-disable-next-line @next/next/no-img-element -- the QR code is an inline SVG data URL */}
          <img className="qr" src={setup.qr} alt="QR code for your authenticator app" />
          <p className="secret">
            On this phone? Enter this setup key instead: <code>{setup.secret}</code>
          </p>
        </>
      )}

      {(setup.kind === "verify" || setup.kind === "enroll") && (
        <form className="auth-form" onSubmit={verify}>
          <label htmlFor="code">
            6-digit code
            <input
              id="code"
              name="code"
              className="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]{6,7}"
              maxLength={7}
              required
              autoFocus
            />
          </label>
          {error && <p className="auth-err" role="alert">{error}</p>}
          <button className="btn" type="submit" disabled={busy}>{busy ? "Checking…" : "Verify and open my planner"}</button>
        </form>
      )}

      <button type="button" className="linkbtn" onClick={signOut}>Sign out</button>
    </AuthCard>
  );
}
