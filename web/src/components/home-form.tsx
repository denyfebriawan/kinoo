"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useRoom } from "@/components/room-provider";
import type { JoinResult } from "@/lib/socket";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/styles";

export default function HomeForm() {
  const router = useRouter();
  const { createRoom, joinRoom } = useRoom();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const hasName = name.trim().length > 0;
  const hasCode = code.trim().length > 0;

  async function run(action: () => Promise<JoinResult>) {
    setBusy(true);
    setError(null);
    const result = await action();
    if (result.ok) {
      router.push(`/room/${result.code}`);
    } else {
      setError(result.error);
      setBusy(false);
    }
  }

  function handleCreate() {
    void run(() => createRoom(name));
  }

  function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(() => joinRoom(code, name));
  }

  return (
    <form onSubmit={handleJoin} className="flex w-full max-w-sm flex-col gap-4">
      <input
        className={inputClass}
        placeholder="Your display name"
        maxLength={24}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />

      <button
        type="button"
        className={primaryButtonClass}
        disabled={busy || !hasName}
        onClick={handleCreate}
      >
        Create a room
      </button>

      <p className="text-center text-sm text-zinc-500">or join with a code</p>

      <div className="flex gap-2">
        <input
          className={`${inputClass} uppercase`}
          placeholder="ROOM CODE"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
        <button
          type="submit"
          className={secondaryButtonClass}
          disabled={busy || !hasName || !hasCode}
        >
          Join
        </button>
      </div>

      {!hasName && (
        <p className="text-center text-sm text-zinc-500">Enter a display name to continue.</p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
