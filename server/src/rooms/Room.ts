import { GameEngine } from "../engine/GameEngine.js";
import { GameRulesConfig, PlayerToken, ChatMessage } from "../types/index.js";

export class Room {
  public id: string;
  public code: string;
  public hostId: string;
  public isPublic: boolean;
  public engine: GameEngine;
  public disconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  public chatHistory: ChatMessage[] = [];

  constructor(
    id: string,
    code: string,
    hostId: string,
    rules?: Partial<GameRulesConfig>,
    isPublic = true
  ) {
    this.id = id;
    this.code = code;
    this.hostId = hostId;
    this.isPublic = isPublic;
    this.engine = new GameEngine(id, code, hostId, rules);
  }

  public addChatMessage(senderId: string, message: string, emoji?: string): ChatMessage {
    const sender = this.engine.state.players[senderId];
    const chatMsg: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderId,
      senderName: sender?.nickname || "Unknown",
      message,
      emoji,
      timestamp: Date.now(),
    };
    this.chatHistory.push(chatMsg);
    if (this.chatHistory.length > 100) {
      this.chatHistory.shift();
    }
    return chatMsg;
  }

  public handleDisconnect(playerId: string, onGraceExpire: (playerId: string) => void): void {
    const player = this.engine.state.players[playerId];
    if (!player) return;

    player.isConnected = false;
    player.socketId = null;

    // Set 60-second grace timer
    if (this.disconnectTimers.has(playerId)) {
      clearTimeout(this.disconnectTimers.get(playerId)!);
    }

    const timer = setTimeout(() => {
      this.disconnectTimers.delete(playerId);
      onGraceExpire(playerId);
    }, 60000);

    this.disconnectTimers.set(playerId, timer);
  }

  public handleReconnect(playerId: string, socketId: string): boolean {
    const player = this.engine.state.players[playerId];
    if (!player) return false;

    if (this.disconnectTimers.has(playerId)) {
      clearTimeout(this.disconnectTimers.get(playerId)!);
      this.disconnectTimers.delete(playerId);
    }

    player.isConnected = true;
    player.socketId = socketId;
    player.lastActive = Date.now();
    return true;
  }
}
