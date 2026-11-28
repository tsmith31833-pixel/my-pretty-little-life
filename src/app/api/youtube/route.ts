import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Public YouTube stats for content insights.
//   GET /api/youtube?video=<url or id>       → one video's title, views, likes, comments
//   GET /api/youtube?channel=<@handle or url> → the channel's latest 12 videos with stats
// Needs YOUTUBE_API_KEY in Vercel (server-only, never sent to the browser).
// Only works for you, signed in with your authenticator code.

const API = "https://www.googleapis.com/youtube/v3";

type Video = { id: string; title: string; url: string; posted_day: string; views: number; likes: number; comments: number; format: string };

function videoId(input: string) {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1, 12);
    const v = u.searchParams.get("v");
    if (v) return v.slice(0, 11);
    const m = u.pathname.match(/\/(shorts|live|embed)\/([\w-]{11})/);
    if (m) return m[2];
  } catch {}
  return null;
}

function handleOf(input: string) {
  const s = input.trim();
  const m = s.match(/@([\w.-]+)/);
  if (m) return m[1];
  try {
    const u = new URL(s);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts[0] === "channel" && parts[1]) return { id: parts[1] };
  } catch {}
  return s.replace(/^@/, "") || null;
}

/** ISO 8601 duration → seconds (used to tell Shorts from long videos). */
function seconds(d: string) {
  const m = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
}

async function yt(path: string, params: Record<string, string>, key: string) {
  const url = `${API}/${path}?${new URLSearchParams({ ...params, key })}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`YouTube said ${res.status}`);
  return res.json();
}

async function statsFor(ids: string[], key: string): Promise<Video[]> {
  if (!ids.length) return [];
  const data = await yt("videos", { part: "snippet,statistics,contentDetails", id: ids.join(","), maxResults: "50" }, key);
  return (data.items ?? []).map((v: { id: string; snippet: { title: string; publishedAt: string }; statistics: Record<string, string>; contentDetails: { duration: string } }) => ({
    id: v.id,
    title: v.snippet.title,
    url: `https://www.youtube.com/watch?v=${v.id}`,
    posted_day: v.snippet.publishedAt.slice(0, 10),
    views: Number(v.statistics.viewCount ?? 0),
    likes: Number(v.statistics.likeCount ?? 0),
    comments: Number(v.statistics.commentCount ?? 0),
    format: seconds(v.contentDetails.duration) <= 180 ? "Short" : "Long video",
  }));
}

async function signedIn(request: NextRequest) {
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} },
  });
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.aal === "aal2";
}

export async function GET(request: NextRequest) {
  if (!(await signedIn(request))) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return NextResponse.json({ error: "YouTube isn't connected yet. Add YOUTUBE_API_KEY in Vercel, then redeploy." }, { status: 503 });

  const params = request.nextUrl.searchParams;
  try {
    const video = params.get("video");
    if (video) {
      const id = videoId(video);
      if (!id) return NextResponse.json({ error: "That doesn't look like a YouTube video link." }, { status: 400 });
      const [v] = await statsFor([id], key);
      return v ? NextResponse.json({ video: v }) : NextResponse.json({ error: "That video wasn't found. Is it public?" }, { status: 404 });
    }

    const channel = params.get("channel");
    if (channel) {
      const h = handleOf(channel);
      if (!h) return NextResponse.json({ error: "Enter a channel handle like @creatorname." }, { status: 400 });
      const ch = await yt("channels", { part: "snippet,contentDetails,statistics", ...(typeof h === "string" ? { forHandle: h } : { id: h.id }) }, key);
      const c = ch.items?.[0];
      if (!c) return NextResponse.json({ error: "That channel wasn't found. Check the handle." }, { status: 404 });
      const uploads = c.contentDetails.relatedPlaylists.uploads;
      const list = await yt("playlistItems", { part: "contentDetails", playlistId: uploads, maxResults: "12" }, key);
      const ids = (list.items ?? []).map((i: { contentDetails: { videoId: string } }) => i.contentDetails.videoId);
      return NextResponse.json({
        channel: { title: c.snippet.title, subscribers: Number(c.statistics.subscriberCount ?? 0) },
        videos: await statsFor(ids, key),
      });
    }
    return NextResponse.json({ error: "Nothing to look up." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "YouTube didn't answer. Check the API key in Vercel, or try again later." }, { status: 502 });
  }
}
