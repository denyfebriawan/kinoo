"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { socket, type JoinResult, type Member } from "@/lib/socket";

interface Room {
  code: string;
  members: Member[];
  selfId: string;
}

interface RoomContextValue {
  room: Room | null;
  createRoom: (name: string) => Promise<JoinResult>;
  joinRoom: (code: string, name: string) => Promise<JoinResult>;
  leaveRoom: () => void;
}

const RoomContext = createContext<RoomContextValue | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    function handlePresence(members: Member[]) {
      setRoom((current) => (current ? { ...current, members } : current));
    }

    function handleDisconnect() {
      setRoom(null);
    }

    socket.on("room:presence", handlePresence);
    socket.on("disconnect", handleDisconnect);
    socket.connect();

    return () => {
      socket.off("room:presence", handlePresence);
      socket.off("disconnect", handleDisconnect);
      socket.disconnect();
    };
  }, []);

  async function request(event: string, ...args: unknown[]): Promise<JoinResult> {
    try {
      const result: JoinResult = await socket.timeout(5000).emitWithAck(event, ...args);
      if (result.ok) {
        setRoom({ code: result.code, members: result.members, selfId: socket.id ?? "" });
      }
      return result;
    } catch {
      return { ok: false, error: "Could not reach the server" };
    }
  }

  function createRoom(name: string) {
    return request("room:create", name);
  }

  function joinRoom(code: string, name: string) {
    return request("room:join", code, name);
  }

  function leaveRoom() {
    socket.emit("room:leave");
    setRoom(null);
  }

  return (
    <RoomContext.Provider value={{ room, createRoom, joinRoom, leaveRoom }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom(): RoomContextValue {
  const value = useContext(RoomContext);
  if (!value) {
    throw new Error("useRoom must be used inside <RoomProvider>");
  }
  return value;
}
