"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRoom } from "@/components/room-provider";
import { inputClass, primaryButtonClass } from "@/lib/styles";

const MAX_CHAT_LENGTH = 300;

export default function ChatPanel() {
  const { room, sendChat } = useRoom();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const messages = room?.chat ?? [];

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

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
    <div className="flex flex-col gap-2">
      <h2 className="font-medium">Chat</h2>

      <ul
        ref={listRef}
        className="flex h-72 flex-col gap-2 overflow-y-auto rounded-md border border-zinc-300 p-2 text-sm dark:border-zinc-700"
      >
        {messages.length === 0 && <li className="text-zinc-500">No messages yet.</li>}
        {messages.map((message) => (
          <li key={message.id} className="break-words">
            <span className="font-medium">
              {message.author}
              {message.authorId === room?.selfId && (
                <span className="font-normal text-zinc-500"> (you)</span>
              )}
              :
            </span>{" "}
            {message.text}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          className={inputClass}
          placeholder="Say something"
          maxLength={MAX_CHAT_LENGTH}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <button
          type="submit"
          className={primaryButtonClass}
          disabled={text.trim().length === 0}
        >
          Send
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
