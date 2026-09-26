import { createServer } from "node:http";
import { Server, type Socket } from "socket.io";
import {
  addChatMessage,
  controlVideo,
  createRoom,
  joinRoom,
  leaveRoom,
  setVideo,
  type ChatMessage,
  type Member,
  type VideoState,
} from "./rooms.js";
import { parseYouTubeId } from "./youtube.js";

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:3000";
const MAX_NAME_LENGTH = 24;
const MAX_VIDEO_POSITION = 24 * 60 * 60;
const MAX_CHAT_LENGTH = 300;
const CHAT_MIN_INTERVAL_MS = 1500;

type JoinResult =
  | { ok: true; code: string; members: Member[]; video: VideoState; chat: ChatMessage[] }
  | { ok: false; error: string };

type AckResult = { ok: true } | { ok: false; error: string };

function cleanName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.trim();
  if (name.length === 0 || name.length > MAX_NAME_LENGTH) return null;
  return name;
}

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN },
});

function leaveCurrentRoom(socket: Socket): void {
  const code: string | undefined = socket.data.roomCode;
  if (!code) return;

  socket.data.roomCode = undefined;
  socket.leave(code);
  const members = leaveRoom(code, socket.id);
  io.to(code).emit("room:presence", members);
}

io.on("connection", (socket) => {
  console.log(`connected: ${socket.id}`);

  socket.on("room:create", (rawName: unknown, ack: (res: JoinResult) => void) => {
    if (typeof ack !== "function") return;
    const name = cleanName(rawName);
    if (!name) return ack({ ok: false, error: "Enter a display name (up to 24 characters)" });

    leaveCurrentRoom(socket);
    const me: Member = { id: socket.id, name };
    const { code, video } = createRoom(me);
    socket.data.roomCode = code;
    socket.join(code);
    ack({ ok: true, code, members: [me], video, chat: [] });
  });

  socket.on(
    "room:join",
    (rawCode: unknown, rawName: unknown, ack: (res: JoinResult) => void) => {
      if (typeof ack !== "function") return;
      const name = cleanName(rawName);
      if (!name) return ack({ ok: false, error: "Enter a display name (up to 24 characters)" });
      if (typeof rawCode !== "string") return ack({ ok: false, error: "Invalid room code" });

      leaveCurrentRoom(socket);
      const code = rawCode.trim().toUpperCase();
      const joined = joinRoom(code, { id: socket.id, name });
      if (!joined) return ack({ ok: false, error: "Room not found" });

      socket.data.roomCode = code;
      socket.join(code);
      ack({
        ok: true,
        code,
        members: joined.members,
        video: joined.video,
        chat: joined.chat,
      });
      socket.to(code).emit("room:presence", joined.members);
    },
  );

  socket.on("room:leave", () => {
    leaveCurrentRoom(socket);
  });

  socket.on("video:set", (rawUrl: unknown, ack: (res: AckResult) => void) => {
    if (typeof ack !== "function") return;
    const code: string | undefined = socket.data.roomCode;
    if (!code) return ack({ ok: false, error: "Not in a room" });
    if (typeof rawUrl !== "string") return ack({ ok: false, error: "Invalid video link" });

    const videoId = parseYouTubeId(rawUrl);
    if (!videoId) return ack({ ok: false, error: "That doesn't look like a YouTube link" });

    const state = setVideo(code, videoId);
    if (!state) return ack({ ok: false, error: "Room not found" });
    io.to(code).emit("video:state", state);
    ack({ ok: true });
  });

  socket.on("video:control", (action: unknown, position: unknown) => {
    const code: string | undefined = socket.data.roomCode;
    if (!code) return;
    if (action !== "play" && action !== "pause" && action !== "seek") return;
    if (typeof position !== "number" || !Number.isFinite(position)) return;
    if (position < 0 || position > MAX_VIDEO_POSITION) return;

    const state = controlVideo(code, action, position);
    if (state) io.to(code).emit("video:state", state);
  });

  socket.on("chat:send", (rawText: unknown, ack: (res: AckResult) => void) => {
    if (typeof ack !== "function") return;
    const code: string | undefined = socket.data.roomCode;
    if (!code) return ack({ ok: false, error: "Not in a room" });
    if (typeof rawText !== "string") return ack({ ok: false, error: "Invalid message" });

    const now = Date.now();
    const lastChatAt: number = socket.data.lastChatAt ?? 0;
    if (now - lastChatAt < CHAT_MIN_INTERVAL_MS) {
      return ack({ ok: false, error: "You're sending messages too fast" });
    }

    const text = rawText.trim();
    if (text.length === 0) return ack({ ok: false, error: "Message is empty" });
    if (text.length > MAX_CHAT_LENGTH) {
      return ack({ ok: false, error: `Message is too long (max ${MAX_CHAT_LENGTH} characters)` });
    }

    const message = addChatMessage(code, socket.id, text);
    if (!message) return ack({ ok: false, error: "Room not found" });

    socket.data.lastChatAt = now;
    io.to(code).emit("chat:message", message);
    ack({ ok: true });
  });

  socket.on("disconnect", (reason) => {
    console.log(`disconnected: ${socket.id} (${reason})`);
    leaveCurrentRoom(socket);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.io server listening on port ${PORT}`);
});
