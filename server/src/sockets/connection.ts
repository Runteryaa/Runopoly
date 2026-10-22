import { Server, Socket } from "socket.io";
import { roomManager } from "../rooms/RoomManager.js";
import { registerGameEvents } from "./gameEvents.js";
import { GameRulesConfig, PlayerToken } from "../types/index.js";

export function setupSocketHandlers(io: Server): void {
  io.on("connection", (socket: Socket) => {
    let currentRoomId: string | null = null;
    let currentPlayerId: string | null = null;

    // 1. Create Room
    socket.on(
      "room:create",
      (
        payload: {
          nickname: string;
          token: PlayerToken;
          rules?: Partial<GameRulesConfig>;
          isPublic?: boolean;
        },
        callback: (res: { success: boolean; roomCode?: string; playerId?: string; error?: string }) => void
      ) => {
        try {
          const playerId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          const room = roomManager.createRoom(playerId, payload.rules, payload.isPublic ?? true);
          room.engine.addPlayer(playerId, payload.nickname, payload.token, socket.id);

          currentRoomId = room.id;
          currentPlayerId = playerId;
          socket.join(room.id);

          registerGameEvents(io, socket, room, playerId);

          callback({
            success: true,
            roomCode: room.code,
            playerId,
          });

          io.to(room.id).emit("gameState:update", room.engine.state);
        } catch (err: any) {
          callback({ success: false, error: err.message || "Failed to create room" });
        }
      }
    );

    // 2. Join Room (or Reconnect)
    socket.on(
      "room:join",
      (
        payload: {
          roomCode: string;
          nickname: string;
          token: PlayerToken;
          sessionToken?: string;
        },
        callback: (res: { success: boolean; playerId?: string; error?: string }) => void
      ) => {
        try {
          const room = roomManager.getRoomByCode(payload.roomCode);
          if (!room) {
            return callback({ success: false, error: "Room not found." });
          }

          // Case A: Reconnecting existing session
          if (payload.sessionToken && room.engine.state.players[payload.sessionToken]) {
            const playerId = payload.sessionToken;
            room.handleReconnect(playerId, socket.id);
            currentRoomId = room.id;
            currentPlayerId = playerId;
            socket.join(room.id);

            registerGameEvents(io, socket, room, playerId);
            callback({ success: true, playerId });

            io.to(room.id).emit("player:reconnected", { playerId });
            io.to(room.id).emit("gameState:update", room.engine.state);
            return;
          }

          // Case B: Joining as new player
          if (room.engine.state.status !== "LOBBY") {
            return callback({ success: false, error: "Game has already started." });
          }

          const playerId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          const added = room.engine.addPlayer(playerId, payload.nickname, payload.token, socket.id);
          if (!added) {
            return callback({ success: false, error: "Room is full or unavailable." });
          }

          roomManager.mapPlayerToRoom(playerId, room.id);
          currentRoomId = room.id;
          currentPlayerId = playerId;
          socket.join(room.id);

          registerGameEvents(io, socket, room, playerId);
          callback({ success: true, playerId });

          io.to(room.id).emit("gameState:update", room.engine.state);
        } catch (err: any) {
          callback({ success: false, error: err.message || "Failed to join room" });
        }
      }
    );

    // 3. Set Ready
    socket.on("room:setReady", (payload: { ready: boolean }) => {
      if (!currentRoomId || !currentPlayerId) return;
      const room = roomManager.getRoomById(currentRoomId);
      if (!room) return;

      const player = room.engine.state.players[currentPlayerId];
      if (player) {
        player.isReady = payload.ready;
        io.to(room.id).emit("gameState:update", room.engine.state);
      }
    });

    // 4. Start Game
    socket.on("room:startGame", () => {
      if (!currentRoomId || !currentPlayerId) return;
      const room = roomManager.getRoomById(currentRoomId);
      if (!room || room.hostId !== currentPlayerId) return;

      if (room.engine.startGame()) {
        io.to(room.id).emit("gameState:update", room.engine.state);
      }
    });

    // 5. Disconnect
    socket.on("disconnect", () => {
      if (!currentRoomId || !currentPlayerId) return;
      const room = roomManager.getRoomById(currentRoomId);
      if (!room) return;

      room.handleDisconnect(currentPlayerId, (expiredPlayerId) => {
        // Disconnect grace period expired
        io.to(room.id).emit("player:disconnected", { playerId: expiredPlayerId, gracePeriodMs: 0 });
        room.engine.removePlayer(expiredPlayerId);
        io.to(room.id).emit("gameState:update", room.engine.state);
      });

      io.to(room.id).emit("gameState:update", room.engine.state);
    });
  });
}
