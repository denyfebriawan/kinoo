"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  socket,
  type AckResult,
  type JoinResult,
  type Member,
  type VideoAction,
  type VideoState,
} from "@/lib/socket";

export interface SyncedVideo extends VideoState {
  receivedAt: number;
}

interface Room {
  code: string;
  members: Member[];
  selfId: string;
  video: SyncedVideo;
}

interface RoomContextValue {
  room: Room | null;
  createRoom: (name: string) => Promise<JoinResult>;
  joinRoom: (code: string, name: string) => Promise<JoinResult>;
  leaveRoom: () => void;
  setVideo: (url: string) => Promise<AckResult>;
  controlVideo: (action: VideoAction, position: number) => void;
}

const RoomContext = createContext<RoomContextValue | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    function handlePresence(members: Member[]) {
      setRoom((current) => (current ? { ...current, members } : current));
    }

    function handleVideoState(state: VideoState) {
      const video: SyncedVideo = { ...state, receivedAt: Date.now() };
      setRoom((current) => (current ? { ...current, video } : current));
    }

    function handleDisconnect() {
      setRoom(null);
    }

    socket.on("room:presence", handlePresence);
    socket.on("video:state", handleVideoState);
    socket.on("disconnect", handleDisconnect);
    socket.connect();

    return () => {
      socket.off("room:presence", handlePresence);
      socket.off("video:state", handleVideoState);
      socket.off("disconnect", handleDisconnect);
      socket.disconnect();
    };
  }, []);

  async function request(event: string, ...args: unknown[]): Promise<JoinResult> {
    try {
      const result: JoinResult = await socket.timeout(5000).emitWithAck(event, ...args);
      if (result.ok) {
        setRoom({
          code: result.code,
          members: result.members,
          selfId: socket.id ?? "",
          video: { ...result.video, receivedAt: Date.now() },
        });
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

  async function setVideo(url: string): Promise<AckResult> {
    try {
      const result: AckResult = await socket.timeout(5000).emitWithAck("video:set", url);
      return result;
    } catch {
      return { ok: false, error: "Could not reach the server" };
    }
  }

  function controlVideo(action: VideoAction, position: number) {
    socket.emit("video:control", action, position);
  }

  return (
    <RoomContext.Provider
      value={{ room, createRoom, joinRoom, leaveRoom, setVideo, controlVideo }}
    >
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
