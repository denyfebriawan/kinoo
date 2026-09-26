"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useRoom } from "@/components/room-provider";
import ChatPanel from "@/components/chat-panel";
import VideoPlayer from "@/components/video-player";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/styles";

export default function RoomView({ code }: { code: string }) {
  const router = useRouter();
  const { room, joinRoom, leaveRoom, setVideo } = useRoom();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoError, setVideoError] = useState<string | null>(null);

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

  async function handleSetVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVideoError(null);
    const result = await setVideo(videoUrl);
    if (result.ok) {
      setVideoUrl("");
    } else {
      setVideoError(result.error);
    }
  }

  function handleLeave() {
    leaveRoom();
    router.push("/");
  }

  if (room?.code === code) {
    return (
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_16rem]">
        <div className="flex flex-col gap-4">
          {room.video.videoId ? (
            <VideoPlayer />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-zinc-300 text-zinc-500 dark:border-zinc-700">
              Paste a YouTube link below to start watching
            </div>
          )}

          <form onSubmit={handleSetVideo} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                className={inputClass}
                placeholder="YouTube link"
                value={videoUrl}
                onChange={(event) => setVideoUrl(event.target.value)}
              />
              <button type="submit" className={primaryButtonClass}>
                Load
              </button>
            </div>
            {videoError && <p className="text-sm text-red-600">{videoError}</p>}
          </form>
        </div>

        <aside className="flex flex-col gap-6">
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

          <ChatPanel />

          <button type="button" className={secondaryButtonClass} onClick={handleLeave}>
            Leave room
          </button>
        </aside>
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
      <button
        type="submit"
        className={primaryButtonClass}
        disabled={busy || name.trim().length === 0}
      >
        Join room
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
