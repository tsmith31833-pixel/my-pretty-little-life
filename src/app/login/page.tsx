"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    const { error } = await supabase().auth.signInWithPassword({
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
    });
    if (error) {
      setBusy(false);
      setError(
        error.message.toLowerCase().includes("invalid")
          ? "That email and password don't match. Check for typos and try again."
          : "Login didn't go through. Check your internet connection and try again.",
      );
      return;
    }
    // Step two: the authenticator code.
    router.replace("/verify");
  }

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your pretty little life.">
      <form className="auth-form" onSubmit={signIn}>
        <label htmlFor="email">
          Email
          <input id="email" name="email" type="email" autoComplete="username" required />
        </label>
        <label htmlFor="password">
          Password
          <input id="password" name="password" type="password" autoComplete="current-password" required />
        </label>
        {error && <p className="auth-err" role="alert">{error}</p>}
        <button className="btn" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </AuthCard>
  );
}
