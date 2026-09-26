import HeroPreview from "@/components/hero-preview";
import HomeForm from "@/components/home-form";

const STEPS = [
  {
    title: "Create a room",
    body: "Pick a display name and get a shareable link and a 6-character code.",
  },
  {
    title: "Paste a YouTube link",
    body: "The video loads for everyone in the room at the same moment.",
  },
  {
    title: "Watch together",
    body: "Play, pause and seek stay locked for all viewers, with live chat on the side.",
  },
];

function delay(ms: number) {
  return { animationDelay: `${ms}ms` };
}

export default function Home() {
  return (
    <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 pb-16 pt-8 sm:pt-14">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-112 overflow-hidden">
        <div className="absolute left-1/2 top-24 -ml-72 h-64 w-xl rounded-full bg-accent/10 blur-3xl motion-safe:animate-float" />
      </div>

      <span
        className="relative rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted motion-safe:animate-fade-up"
        style={delay(0)}
      >
        Free · no sign-up
      </span>

      <h1
        className="relative mt-6 max-w-3xl text-balance text-center text-4xl font-semibold tracking-tight sm:text-6xl motion-safe:animate-fade-up"
        style={delay(80)}
      >
        Watch together, <span className="text-accent">perfectly in sync.</span>
      </h1>
      <p
        className="relative mt-5 max-w-xl text-center text-lg text-muted motion-safe:animate-fade-up"
        style={delay(160)}
      >
        Create a room, share the link, and press play. Everyone&apos;s YouTube video stays
        locked together, with live chat alongside.
      </p>

      <div className="relative mt-10 grid w-full items-center gap-6 lg:grid-cols-2 lg:gap-10">
        <div className="mx-auto w-full max-w-md motion-safe:animate-fade-up" style={delay(260)}>
          <HomeForm />
        </div>
        <div className="mx-auto w-full max-w-md motion-safe:animate-fade-up lg:max-w-none" style={delay(360)}>
          <HeroPreview />
        </div>
      </div>

      <ol className="relative mt-20 grid w-full gap-4 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="rounded-2xl border border-line bg-surface p-5 transition duration-200 hover:-translate-y-1 hover:border-accent/40 motion-safe:animate-fade-up"
            style={delay(480 + index * 100)}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
              {index + 1}
            </span>
            <h2 className="mt-4 font-medium">{step.title}</h2>
            <p className="mt-1 text-sm text-muted">{step.body}</p>
          </li>
        ))}
      </ol>

      <p
        className="relative mt-10 text-center text-sm text-muted motion-safe:animate-fade-up"
        style={delay(800)}
      >
        No accounts. Rooms and chat disappear when everyone leaves.
      </p>
    </main>
  );
}
