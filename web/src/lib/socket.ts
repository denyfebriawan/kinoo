import { io } from "socket.io-client";

export interface Member {
  id: string;
  name: string;
}

export type JoinResult =
  | { ok: true; code: string; members: Member[] }
  | { ok: false; error: string };

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

export const socket = io(SOCKET_URL, { autoConnect: false });
