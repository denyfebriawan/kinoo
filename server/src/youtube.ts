const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

export function parseYouTubeId(input: string): string | null {
  const text = input.trim();
  if (VIDEO_ID.test(text)) return text;

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (!YOUTUBE_HOSTS.has(url.hostname)) return null;

  let candidate: string | null | undefined;
  if (url.hostname === "youtu.be") {
    candidate = url.pathname.slice(1);
  } else if (url.pathname === "/watch") {
    candidate = url.searchParams.get("v");
  } else {
    const [kind, id] = url.pathname.split("/").filter(Boolean);
    if (kind === "embed" || kind === "shorts" || kind === "live") {
      candidate = id;
    }
  }

  return candidate && VIDEO_ID.test(candidate) ? candidate : null;
}
