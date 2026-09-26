"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRoom } from "@/components/room-provider";
import { cardClass, inputClass, primaryButtonClass } from "@/lib/styles";

const MAX_CHAT_LENGTH = 300;
const NEAR_BOTTOM_PX = 48;

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPanel() {
  const { room, sendChat } = useRoom();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const stickToBottom = useRef(true);

  const messages = room?.chat ?? [];

  useEffect(() => {
    const list = listRef.current;
    if (list && stickToBottom.current) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  function handleScroll() {
    const list = listRef.current;
    if (!list) return;
    stickToBottom.current =
      list.scrollHeight - list.scrollTop - list.clientHeight < NEAR_BOTTOM_PX;
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSending(true);
    stickToBottom.current = true;
    const result = await sendChat(text);
    if (result.ok) {
      setText("");
    } else {
      setError(result.error);
    }
    setSending(false);
  }

  return (
    <section className={`${cardClass} flex flex-col`}>
      <h2 className="border-b border-line px-4 py-3 text-sm font-medium text-muted">Chat</h2>

      <ul
        ref={listRef}
        onScroll={handleScroll}
        role="log"
        aria-label="Chat messages"
        className="scroll-thin flex h-72 flex-col gap-1 overflow-y-auto px-4 py-3 lg:h-96"
      >
        {messages.length === 0 && (
          <li className="m-auto text-center text-sm text-muted">
            No messages yet.
            <br />
            Say hi to the room.
          </li>
        )}
        {messages.map((message, index) => {
          const isOwn = message.authorId === room?.selfId;
          const startsGroup = messages[index - 1]?.authorId !== message.authorId;
          return (
            <li
              key={message.id}
              className={`flex max-w-[88%] flex-col ${isOwn ? "items-end self-end" : "items-start self-start"} ${startsGroup && index > 0 ? "mt-2" : ""}`}
            >
              {startsGroup && !isOwn && (
                <span className="mb-0.5 px-1 text-xs font-medium text-muted">
                  {message.author}
                </span>
              )}
              <div
                className={`wrap-break-word rounded-2xl px-3 py-1.5 text-sm ${
                  isOwn
                    ? "rounded-br-md border border-accent/30 bg-accent/15"
                    : "rounded-bl-md bg-raised"
                }`}
              >
                {message.text}
              </div>
              <span className="mt-0.5 px-1 text-[10px] text-muted/80">
                {formatTime(message.sentAt)}
              </span>
            </li>
          );
        })}
      </ul>

      <form onSubmit={handleSend} className="flex flex-col gap-2 border-t border-line p-3">
        <div className="flex gap-2">
          <input
            aria-label="Chat message"
            className={inputClass}
            placeholder="Say something"
            maxLength={MAX_CHAT_LENGTH}
            autoComplete="off"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <button
            type="submit"
            className={primaryButtonClass}
            disabled={sending || text.trim().length === 0}
          >
            Send
          </button>
        </div>
        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
