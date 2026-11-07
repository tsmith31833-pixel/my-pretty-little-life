import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Runs before every page. It keeps your login fresh and sends anyone who
// isn't fully signed in (password AND authenticator code) to the login pages.
// The database has its own rules too, so this is the first lock, not the only one.

const LOGIN = "/login";
const VERIFY = "/verify";

/** A plain page explaining a setup problem. Names settings only, never their values. */
function setupProblem(message: string) {
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>My Pretty Little Life</title>
<body style="font-family:system-ui,sans-serif;background:#FFF8F3;color:#4A1A31;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px">
<div style="max-width:440px;background:#fff;border:1px solid #F3D5E0;border-radius:24px;padding:28px">
<h1 style="color:#E2357B;font-size:1.3rem;margin:0 0 10px">The planner can't start yet</h1>
<p style="line-height:1.5;margin:0">${message}</p></div></body>`;
  return new NextResponse(html, { status: 503, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  const missing = [!url && "NEXT_PUBLIC_SUPABASE_URL", !key && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"].filter(Boolean);
  if (missing.length) {
    return setupProblem(
      `Vercel is missing this setting: <b>${missing.join("</b> and <b>")}</b>. Add it in Vercel → Settings → Environment Variables (the name must match exactly), then redeploy.`,
    );
  }
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url!)) {
    return setupProblem(
      "The setting <b>NEXT_PUBLIC_SUPABASE_URL</b> doesn't look like a Supabase Project URL. It should look exactly like <b>https://abcdefgh.supabase.co</b>, with nothing after <b>.co</b>. Fix it in Vercel, then redeploy.",
    );
  }

  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;

  try {
    const supabase = createServerClient(url!, key!, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
        },
      },
    });

    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;

    const goTo = (target: string) => {
      if (path === target) return response;
      const redirect = NextResponse.redirect(new URL(target, request.url));
      response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
      return redirect;
    };

    if (!claims) return goTo(LOGIN);
    if (claims.aal !== "aal2") return goTo(VERIFY);
    if (path === LOGIN || path === VERIFY) return goTo("/");
    return response;
  } catch (err) {
    // Shows up in Vercel → Logs. Never let a failed check open the planner.
    console.error("Login check failed:", err);
    if (path === LOGIN) return NextResponse.next({ request });
    return NextResponse.redirect(new URL(LOGIN, request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
