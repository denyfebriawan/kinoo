"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useRoom } from "@/components/room-provider";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/styles";

export default function RoomView({ code }: { code: string }) {
  const router = useRouter();
  const { room, joinRoom, leaveRoom } = useRoom();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await joinRoom(code, name);
    if (!result.ok) {
      setError(result.error);
    }
    setBusy(false);
  }

  function handleLeave() {
    leaveRoom();
    router.push("/");
  }

  if (room?.code === code) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div>
          <p className="text-sm text-zinc-500">Room code</p>
          <p className="font-mono text-3xl font-semibold tracking-widest">{code}</p>
          <p className="mt-1 text-sm text-zinc-500">Share this page&apos;s link or the code.</p>
        </div>

        <div>
          <h2 className="mb-2 font-medium">Watching now ({room.members.length})</h2>
          <ul className="flex flex-col gap-1">
            {room.members.map((member) => (
              <li key={member.id}>
                {member.name}
                {member.id === room.selfId && (
                  <span className="text-zinc-500"> (you)</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <button type="button" className={secondaryButtonClass} onClick={handleLeave}>
          Leave room
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleJoin} className="flex w-full max-w-sm flex-col gap-4">
      <p>
        Join room <span className="font-mono font-semibold tracking-widest">{code}</span>
      </p>
      <input
        className={inputClass}
        placeholder="Your display name"
        maxLength={24}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <button type="submit" className={primaryButtonClass} disabled={busy}>
        Join room
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
