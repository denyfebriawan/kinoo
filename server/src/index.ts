import { createServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { createRoom, joinRoom, leaveRoom, type Member } from "./rooms.js";

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:3000";
const MAX_NAME_LENGTH = 24;

type JoinResult =
  | { ok: true; code: string; members: Member[] }
  | { ok: false; error: string };

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
    if (!name) return ack({ ok: false, error: "Invalid display name" });

    leaveCurrentRoom(socket);
    const me: Member = { id: socket.id, name };
    const code = createRoom(me);
    socket.data.roomCode = code;
    socket.join(code);
    ack({ ok: true, code, members: [me] });
  });

  socket.on(
    "room:join",
    (rawCode: unknown, rawName: unknown, ack: (res: JoinResult) => void) => {
      if (typeof ack !== "function") return;
      const name = cleanName(rawName);
      if (!name) return ack({ ok: false, error: "Invalid display name" });
      if (typeof rawCode !== "string") return ack({ ok: false, error: "Invalid room code" });

      leaveCurrentRoom(socket);
      const code = rawCode.trim().toUpperCase();
      const members = joinRoom(code, { id: socket.id, name });
      if (!members) return ack({ ok: false, error: "Room not found" });

      socket.data.roomCode = code;
      socket.join(code);
      ack({ ok: true, code, members });
      socket.to(code).emit("room:presence", members);
    },
  );

  socket.on("room:leave", () => {
    leaveCurrentRoom(socket);
  });

  socket.on("disconnect", (reason) => {
    console.log(`disconnected: ${socket.id} (${reason})`);
    leaveCurrentRoom(socket);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.io server listening on port ${PORT}`);
});
