import { randomInt } from "node:crypto";

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

interface StoredVideo extends VideoState {
  updatedAt: number;
}

interface Room {
  code: string;
  members: Map<string, Member>;
  video: StoredVideo;
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

const rooms = new Map<string, Room>();

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET.charAt(randomInt(CODE_ALPHABET.length));
  }
  return code;
}

function currentVideoState(room: Room): VideoState {
  const { videoId, playing, position, updatedAt } = room.video;
  const elapsedSeconds = playing ? (Date.now() - updatedAt) / 1000 : 0;
  return { videoId, playing, position: position + elapsedSeconds };
}

export function createRoom(creator: Member): { code: string; video: VideoState } {
  let code = generateCode();
  while (rooms.has(code)) {
    code = generateCode();
  }
  const room: Room = {
    code,
    members: new Map([[creator.id, creator]]),
    video: { videoId: null, playing: false, position: 0, updatedAt: Date.now() },
  };
  rooms.set(code, room);
  return { code, video: currentVideoState(room) };
}

export function joinRoom(
  code: string,
  member: Member,
): { members: Member[]; video: VideoState } | undefined {
  const room = rooms.get(code);
  if (!room) return undefined;
  room.members.set(member.id, member);
  return { members: Array.from(room.members.values()), video: currentVideoState(room) };
}

export function leaveRoom(code: string, memberId: string): Member[] {
  const room = rooms.get(code);
  if (!room) return [];
  room.members.delete(memberId);
  if (room.members.size === 0) {
    rooms.delete(code);
    return [];
  }
  return Array.from(room.members.values());
}

export function setVideo(code: string, videoId: string): VideoState | undefined {
  const room = rooms.get(code);
  if (!room) return undefined;
  room.video = { videoId, playing: false, position: 0, updatedAt: Date.now() };
  return currentVideoState(room);
}

export function controlVideo(
  code: string,
  action: VideoAction,
  position: number,
): VideoState | undefined {
  const room = rooms.get(code);
  if (!room || room.video.videoId === null) return undefined;
  const playing = action === "seek" ? room.video.playing : action === "play";
  room.video = { videoId: room.video.videoId, playing, position, updatedAt: Date.now() };
  return currentVideoState(room);
}
