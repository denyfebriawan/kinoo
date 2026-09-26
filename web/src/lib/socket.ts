import { io } from "socket.io-client";

export interface Member {
  id: string;
  name: string;
}

export interface VideoState {
  videoId: string | null;
  playing: boolean;
  position: number;
}

export type VideoAction = "play" | "pause" | "seek";

export interface ChatMessage {
  id: string;
  authorId: string;
  author: string;
  text: string;
  sentAt: number;
}

export type JoinResult =
  | { ok: true; code: string; members: Member[]; video: VideoState; chat: ChatMessage[] }
  | { ok: false; error: string };

export type AckResult = { ok: true } | { ok: false; error: string };

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

export const socket = io(SOCKET_URL, { autoConnect: false });
