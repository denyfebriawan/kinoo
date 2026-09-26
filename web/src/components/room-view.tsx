"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/avatar";
import ChatPanel from "@/components/chat-panel";
import { CheckIcon, CopyIcon, LeaveIcon, PlayCircleIcon } from "@/components/icons";
import { useRoom, type Room } from "@/components/room-provider";
import VideoPlayer from "@/components/video-player";
import {
  cardClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/lib/styles";

export default function RoomView({ code }: { code: string }) {
  const { room } = useRoom();

  if (room?.code === code) {
    return <RoomScreen room={room} />;
  }
  return <JoinPrompt code={code} />;
}

function JoinPrompt({ code }: { code: string }) {
  const { status, joinRoom } = useRoom();
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

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16">
      <form onSubmit={handleJoin} className={`${cardClass} flex flex-col gap-4 p-6`}>
        <div>
          <p className="text-sm text-muted">You&apos;ve been invited to room</p>
          <p className="mt-1 font-mono text-3xl font-semibold tracking-widest text-accent">
            {code}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="join-name" className="text-sm font-medium">
            Your display name
          </label>
          <input
            id="join-name"
            className={inputClass}
            placeholder="e.g. Deny"
            maxLength={24}
            autoComplete="nickname"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <button
          type="submit"
          className={primaryButtonClass}
          disabled={busy || name.trim().length === 0}
        >
          {busy ? "Joining…" : "Join room"}
        </button>

        {status === "offline" && (
          <p className="text-center text-xs text-muted">
            Connection lost. Reconnecting — you can join once it&apos;s back.
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
      </form>
    </main>
  );
}

function RoomScreen({ room }: { room: Room }) {
  const router = useRouter();
  const { leaveRoom, setVideo } = useRoom();
  const [videoUrl, setVideoUrl] = useState("");
  const [videoError, setVideoError] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeoutId = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      // Clipboard can be blocked (insecure context, permissions); the code is still visible.
    }
  }

  async function handleSetVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVideoError(null);
    setLoadingVideo(true);
    const result = await setVideo(videoUrl);
    if (result.ok) {
      setVideoUrl("");
    } else {
      setVideoError(result.error);
    }
    setLoadingVideo(false);
  }

  function handleLeave() {
    leaveRoom();
    router.push("/");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <span className="text-sm text-muted">Room</span>
          <span className="font-mono text-2xl font-semibold tracking-widest">{room.code}</span>
        </div>
        <div className="flex gap-2">
          <button type="button" className={secondaryButtonClass} onClick={handleCopy}>
            {copied ? (
              <CheckIcon className="h-4 w-4 text-success" />
            ) : (
              <CopyIcon className="h-4 w-4" />
            )}
            {copied ? "Link copied" : "Copy invite link"}
          </button>
          <button type="button" className={secondaryButtonClass} onClick={handleLeave}>
            <LeaveIcon className="h-4 w-4" />
            Leave
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-4">
          {room.video.videoId ? (
            <VideoPlayer />
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-surface px-6 text-center">
              <PlayCircleIcon className="h-14 w-14 text-accent" />
              <p className="font-medium">Nothing playing yet</p>
              <p className="max-w-sm text-sm text-muted">
                Paste a YouTube link below. It will load for everyone in the room.
              </p>
            </div>
          )}

          <form onSubmit={handleSetVideo} className={`${cardClass} flex flex-col gap-2 p-4`}>
            <label htmlFor="video-url" className="text-sm font-medium">
              {room.video.videoId ? "Change video" : "Video link"}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="video-url"
                className={inputClass}
                placeholder="https://www.youtube.com/watch?v=…"
                value={videoUrl}
                onChange={(event) => setVideoUrl(event.target.value)}
              />
              <button
                type="submit"
                className={primaryButtonClass}
                disabled={loadingVideo || videoUrl.trim().length === 0}
              >
                {loadingVideo ? "Loading…" : "Load video"}
              </button>
            </div>
            {videoError ? (
              <p role="alert" className="text-sm text-danger">
                {videoError}
              </p>
            ) : (
              <p className="text-xs text-muted">
                Anyone in the room can play, pause and seek for everyone.
              </p>
            )}
          </form>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <section className={`${cardClass} p-4`}>
            <h2 className="mb-3 text-sm font-medium text-muted">
              In the room · {room.members.length}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {room.members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-2 rounded-full bg-raised py-1 pl-1 pr-3 text-sm"
                >
                  <Avatar name={member.name} />
                  <span className="max-w-32 truncate">{member.name}</span>
                  {member.id === room.selfId && (
                    <span className="text-xs text-muted">you</span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <ChatPanel />
        </aside>
      </div>
    </main>
  );
}
