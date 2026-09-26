import HomeForm from "@/components/home-form";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Kinoo</h1>
        <p className="mt-2 text-zinc-500">Watch YouTube together, in sync.</p>
      </div>
      <HomeForm />
    </main>
  );
}
