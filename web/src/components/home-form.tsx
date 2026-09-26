"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useRoom } from "@/components/room-provider";
import type { JoinResult } from "@/lib/socket";
import {
  cardClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/lib/styles";

type Action = "create" | "join";

export default function HomeForm() {
  const router = useRouter();
  const { createRoom, joinRoom } = useRoom();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Action | null>(null);
  const hasName = name.trim().length > 0;
  const hasCode = code.trim().length > 0;

  async function run(action: Action, request: () => Promise<JoinResult>) {
    setBusy(action);
    setError(null);
    const result = await request();
    if (result.ok) {
      router.push(`/room/${result.code}`);
    } else {
      setError(result.error);
      setBusy(null);
    }
  }

  function handleCreate() {
    void run("create", () => createRoom(name));
  }

  function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run("join", () => joinRoom(code, name));
  }

  return (
    <form onSubmit={handleJoin} className={`${cardClass} flex flex-col gap-4 p-5 sm:p-6`}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="display-name" className="text-sm font-medium">
          Your display name
        </label>
        <input
          id="display-name"
          className={inputClass}
          placeholder="e.g. Deny"
          maxLength={24}
          autoComplete="nickname"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <button
        type="button"
        className={primaryButtonClass}
        disabled={busy !== null || !hasName}
        onClick={handleCreate}
      >
        {busy === "create" ? "Creating room…" : "Create a room"}
      </button>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        or join with a code
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="flex gap-2">
        <input
          aria-label="Room code"
          className={`${inputClass} font-mono uppercase tracking-widest`}
          placeholder="ROOM CODE"
          maxLength={6}
          autoComplete="off"
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
        <button
          type="submit"
          className={secondaryButtonClass}
          disabled={busy !== null || !hasName || !hasCode}
        >
          {busy === "join" ? "Joining…" : "Join"}
        </button>
      </div>

      {!hasName && (
        <p className="text-center text-xs text-muted">Enter a display name to continue.</p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
