import { Room } from "./Room.js";
import { GameRulesConfig } from "../types/index.js";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export class RoomManager {
  private roomsById: Map<string, Room> = new Map();
  private roomsByCode: Map<string, Room> = new Map();
  private playerToRoomId: Map<string, string> = new Map(); // Session ID -> Room ID

  public createRoom(
    hostId: string,
    rules?: Partial<GameRulesConfig>,
    isPublic = true
  ): Room {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const code = this.generateUniqueCode();

    const room = new Room(roomId, code, hostId, rules, isPublic);
    this.roomsById.set(roomId, room);
    this.roomsByCode.set(code, room);
    this.playerToRoomId.set(hostId, roomId);

    return room;
  }

  public getRoomByCode(code: string): Room | undefined {
    return this.roomsByCode.get(code.toUpperCase());
  }

  public getRoomById(id: string): Room | undefined {
    return this.roomsById.get(id);
  }

  public getRoomByPlayerId(playerId: string): Room | undefined {
    const roomId = this.playerToRoomId.get(playerId);
    return roomId ? this.roomsById.get(roomId) : undefined;
  }

  public mapPlayerToRoom(playerId: string, roomId: string): void {
    this.playerToRoomId.set(playerId, roomId);
  }

  public removeRoom(roomId: string): void {
    const room = this.roomsById.get(roomId);
    if (!room) return;

    this.roomsByCode.delete(room.code);
    this.roomsById.delete(roomId);

    for (const pid of room.engine.state.playerOrder) {
      this.playerToRoomId.delete(pid);
    }
  }

  public getPublicRooms(): Array<{
    code: string;
    playerCount: number;
    maxPlayers: number;
    status: string;
    hostName: string;
  }> {
    const list: Array<{
      code: string;
      playerCount: number;
      maxPlayers: number;
      status: string;
      hostName: string;
    }> = [];

    for (const room of this.roomsById.values()) {
      if (room.isPublic && room.engine.state.status === "LOBBY") {
        const host = room.engine.state.players[room.hostId];
        list.push({
          code: room.code,
          playerCount: room.engine.state.playerOrder.length,
          maxPlayers: 8,
          status: room.engine.state.status,
          hostName: host?.nickname || "Host",
        });
      }
    }

    return list;
  }

  private generateUniqueCode(): string {
    let code = "";
    let attempts = 0;
    do {
      code = "";
      for (let i = 0; i < 4; i++) {
        code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
      }
      attempts++;
    } while (this.roomsByCode.has(code) && attempts < 1000);

    return code;
  }
}

export const roomManager = new RoomManager();
