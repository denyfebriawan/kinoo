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

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 pb-16 pt-8 sm:pt-16">
      <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
        Free · no sign-up
      </span>

      <h1 className="mt-6 max-w-3xl text-balance text-center text-4xl font-semibold tracking-tight sm:text-6xl">
        Watch together,{" "}
        <span className="text-accent">perfectly in sync.</span>
      </h1>
      <p className="mt-5 max-w-xl text-center text-lg text-muted">
        Create a room, share the link, and press play. Everyone&apos;s YouTube video stays
        locked together, with live chat alongside.
      </p>

      <div className="mt-10 w-full max-w-md">
        <HomeForm />
      </div>

      <ol className="mt-20 grid w-full gap-4 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="rounded-2xl border border-line bg-surface p-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
              {index + 1}
            </span>
            <h2 className="mt-4 font-medium">{step.title}</h2>
            <p className="mt-1 text-sm text-muted">{step.body}</p>
          </li>
        ))}
      </ol>

      <p className="mt-10 text-center text-sm text-muted">
        No accounts. Rooms and chat disappear when everyone leaves.
      </p>
    </main>
  );
}
