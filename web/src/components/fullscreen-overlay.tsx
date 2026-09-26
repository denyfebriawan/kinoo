"use client";

import { useState, type FormEvent } from "react";
import { ChatIcon, CloseIcon } from "@/components/icons";
import { useRoom } from "@/components/room-provider";

const MAX_CHAT_LENGTH = 300;
const MAX_VISIBLE_MESSAGES = 6;

const glassButtonClass =
  "pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/75 motion-safe:active:scale-95";

export default function FullscreenOverlay({ onExit }: { onExit: () => void }) {
  const { room, sendChat } = useRoom();
  const [chatVisible, setChatVisible] = useState(true);
  const [seenIds] = useState(() => new Set(room?.chat.map((message) => message.id)));
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recent = (room?.chat ?? [])
    .filter((message) => !seenIds.has(message.id))
    .slice(-MAX_VISIBLE_MESSAGES);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const result = await sendChat(text);
    if (result.ok) {
      setText("");
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <span className="rounded-full bg-black/55 px-3 py-1.5 text-xs text-white backdrop-blur">
          {room?.members.length ?? 0} watching
        </span>
        <button
          type="button"
          className={glassButtonClass}
          aria-label={chatVisible ? "Hide chat" : "Show chat"}
          aria-pressed={chatVisible}
          onClick={() => setChatVisible((visible) => !visible)}
        >
          <ChatIcon className={`h-5 w-5 ${chatVisible ? "text-accent" : ""}`} />
        </button>
        <button type="button" className={glassButtonClass} aria-label="Exit fullscreen" onClick={onExit}>
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <div
        className={`absolute bottom-16 right-4 flex w-80 max-w-[calc(100%-2rem)] flex-col items-end ${
          chatVisible ? "" : "invisible"
        }`}
      >
        <ul aria-label="Recent chat messages" className="flex w-full flex-col items-end">
          {recent.map((message) => (
            <li
              key={message.id}
              className="mb-2 max-w-full overflow-hidden rounded-2xl bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur-sm motion-safe:animate-overlay-life"
            >
              <span className="mr-1.5 font-semibold text-accent">
                {message.authorId === room?.selfId ? "You" : message.author}
              </span>
              <span className="wrap-break-word">{message.text}</span>
            </li>
          ))}
        </ul>

        <form onSubmit={handleSend} className="pointer-events-auto w-full">
          <input
            aria-label="Chat message"
            className="w-full rounded-full border border-white/20 bg-black/55 px-4 py-2 text-sm text-white outline-none backdrop-blur transition placeholder:text-white/60 focus:border-accent focus:bg-black/75"
            placeholder="Say something…"
            maxLength={MAX_CHAT_LENGTH}
            autoComplete="off"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          {error && (
            <p role="alert" className="mt-1 px-2 text-xs text-danger [text-shadow:0_1px_2px_black]">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
