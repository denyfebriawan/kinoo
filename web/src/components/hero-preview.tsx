import Avatar from "@/components/avatar";
import { PlayCircleIcon } from "@/components/icons";

const BUBBLES = [
  { author: "Mira", text: "ready when you are", delay: "0s" },
  { author: "Deny", text: "3… 2… 1…", delay: "2.6s" },
  { author: "Mira", text: "perfectly in sync 🙌", delay: "5.2s" },
];

const VIEWERS = ["Deny", "Mira"];

export default function HeroPreview() {
  return (
    <div
      aria-hidden="true"
      className="relative w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/40"
    >
      <div className="relative aspect-video bg-linear-to-br from-raised via-surface to-canvas">
        <div className="absolute inset-0 flex items-center justify-center">
          <PlayCircleIcon className="h-16 w-16 text-accent/80" />
        </div>

        <span className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/40 px-2.5 py-1 text-xs text-muted">
          <span className="h-2 w-2 rounded-full bg-success motion-safe:animate-pulse" />
          2 watching
        </span>

        <div className="absolute bottom-3 right-3 flex w-[68%] flex-col items-end gap-1.5">
          {BUBBLES.map((bubble) => (
            <div
              key={bubble.text}
              className="rounded-2xl bg-black/55 px-3 py-1 text-xs text-white backdrop-blur-sm motion-safe:animate-bubble"
              style={{ animationDelay: bubble.delay }}
            >
              <span className="mr-1.5 font-semibold text-accent">{bubble.author}</span>
              {bubble.text}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {VIEWERS.map((name) => (
          <div key={name} className="flex items-center gap-3">
            <Avatar name={name} className="h-6 w-6 text-[10px]" />
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised">
              <div className="h-full origin-left rounded-full bg-accent motion-safe:animate-progress" />
            </div>
          </div>
        ))}
        <p className="text-center text-xs text-muted">Everyone stays on the same second</p>
      </div>
    </div>
  );
}
