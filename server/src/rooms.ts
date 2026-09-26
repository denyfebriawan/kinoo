import { randomInt } from "node:crypto";

export interface Member {
  id: string;
  name: string;
}

interface Room {
  code: string;
  members: Map<string, Member>;
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

export function createRoom(creator: Member): string {
  let code = generateCode();
  while (rooms.has(code)) {
    code = generateCode();
  }
  rooms.set(code, { code, members: new Map([[creator.id, creator]]) });
  return code;
}

export function joinRoom(code: string, member: Member): Member[] | undefined {
  const room = rooms.get(code);
  if (!room) return undefined;
  room.members.set(member.id, member);
  return Array.from(room.members.values());
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
