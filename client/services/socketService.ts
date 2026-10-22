import { io, Socket } from "socket.io-client";
import { useGameStore } from "../store/gameStore.js";
import { GameRulesConfig, PlayerToken, TradeOffer } from "../types/index.js";

class SocketService {
  public socket: Socket | null = null;

  public connect(url: string): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(url, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    this.socket.on("connect", () => {
      console.log("Connected to RunoPoly server:", this.socket?.id);
      useGameStore.getState().setConnected(true);
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from RunoPoly server");
      useGameStore.getState().setConnected(false);
    });

    this.socket.on("gameState:update", (state) => {
      useGameStore.getState().setGameState(state);
    });

    this.socket.on("game:chatMessage", (chat) => {
      useGameStore.getState().addChatMessage(chat);
    });

    this.socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
      useGameStore.getState().setConnected(false);
    });

    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    useGameStore.getState().setConnected(false);
  }

  public createRoom(
    nickname: string,
    token: PlayerToken,
    rules: Partial<GameRulesConfig>,
    callback: (res: { success: boolean; roomCode?: string; playerId?: string; error?: string }) => void
  ): void {
    if (!this.socket) return callback({ success: false, error: "Socket not connected" });
    this.socket.emit("room:create", { nickname, token, rules }, callback);
  }

  public joinRoom(
    roomCode: string,
    nickname: string,
    token: PlayerToken,
    sessionToken: string | undefined,
    callback: (res: { success: boolean; playerId?: string; error?: string }) => void
  ): void {
    if (!this.socket) return callback({ success: false, error: "Socket not connected" });
    this.socket.emit("room:join", { roomCode, nickname, token, sessionToken }, callback);
  }

  public setReady(ready: boolean): void {
    this.socket?.emit("room:setReady", { ready });
  }

  public startGame(): void {
    this.socket?.emit("room:startGame");
  }

  public rollDice(): void {
    this.socket?.emit("game:rollDice");
  }

  public buyProperty(): void {
    this.socket?.emit("game:buyProperty");
  }

  public declineProperty(): void {
    this.socket?.emit("game:declineProperty");
  }

  public auctionBid(amount: number): void {
    this.socket?.emit("game:auctionBid", { amount });
  }

  public auctionFold(): void {
    this.socket?.emit("game:auctionFold");
  }

  public buildHouse(spaceIndex: number): void {
    this.socket?.emit("game:buildHouse", { spaceIndex });
  }

  public sellHouse(spaceIndex: number): void {
    this.socket?.emit("game:sellHouse", { spaceIndex });
  }

  public mortgageProperty(spaceIndex: number): void {
    this.socket?.emit("game:mortgageProperty", { spaceIndex });
  }

  public unmortgageProperty(spaceIndex: number): void {
    this.socket?.emit("game:unmortgageProperty", { spaceIndex });
  }

  public payJailFine(): void {
    this.socket?.emit("game:payJailFine");
  }

  public useJailCard(): void {
    this.socket?.emit("game:useJailCard");
  }

  public endTurn(): void {
    this.socket?.emit("game:endTurn");
  }

  public declareBankruptcy(): void {
    this.socket?.emit("game:declareBankruptcy");
  }

  public proposeTrade(offer: Omit<TradeOffer, "id" | "status" | "createdAt">): void {
    this.socket?.emit("game:proposeTrade", offer);
  }

  public respondTrade(tradeId: string, accept: boolean): void {
    this.socket?.emit("game:respondTrade", { tradeId, accept });
  }

  public sendChat(message: string, emoji?: string): void {
    this.socket?.emit("game:sendChat", { message, emoji });
  }
}

export const socketService = new SocketService();
