import { Server, Socket } from "socket.io";
import { Room } from "../rooms/Room.js";
import { TradeOffer } from "../types/index.js";

export function registerGameEvents(io: Server, socket: Socket, room: Room, playerId: string): void {
  const engine = room.engine;

  const broadcastState = () => {
    io.to(room.id).emit("gameState:update", engine.state);
  };

  // Roll dice
  socket.on("game:rollDice", () => {
    if (engine.state.status !== "PLAYING") return;
    if (engine.getActivePlayer().id !== playerId) return;

    const roll = engine.rollDice();
    if (roll) {
      io.to(room.id).emit("game:diceRolled", {
        dice: roll.dice,
        isDoubles: roll.isDoubles,
        newPosition: engine.getActivePlayer().position,
      });
      broadcastState();
    }
  });

  // Buy property
  socket.on("game:buyProperty", () => {
    if (engine.getActivePlayer().id !== playerId) return;
    if (engine.buyProperty()) {
      broadcastState();
    }
  });

  // Decline property
  socket.on("game:declineProperty", () => {
    if (engine.getActivePlayer().id !== playerId) return;
    if (engine.declineProperty()) {
      broadcastState();
    }
  });

  // Auction bid
  socket.on("game:auctionBid", (payload: { amount: number }) => {
    if (engine.placeAuctionBid(playerId, payload.amount)) {
      broadcastState();
    }
  });

  // Auction fold
  socket.on("game:auctionFold", () => {
    engine.foldAuctionBid(playerId);
    broadcastState();
  });

  // Mortgage property
  socket.on("game:mortgageProperty", (payload: { spaceIndex: number }) => {
    if (engine.mortgageProperty(playerId, payload.spaceIndex)) {
      broadcastState();
    }
  });

  // Unmortgage property
  socket.on("game:unmortgageProperty", (payload: { spaceIndex: number }) => {
    if (engine.unmortgageProperty(playerId, payload.spaceIndex)) {
      broadcastState();
    }
  });

  // Build house
  socket.on("game:buildHouse", (payload: { spaceIndex: number }) => {
    if (engine.buildHouse(playerId, payload.spaceIndex)) {
      broadcastState();
    }
  });

  // Sell house
  socket.on("game:sellHouse", (payload: { spaceIndex: number }) => {
    if (engine.sellHouse(playerId, payload.spaceIndex)) {
      broadcastState();
    }
  });

  // Pay jail fine
  socket.on("game:payJailFine", () => {
    if (engine.payJailFine(playerId)) {
      broadcastState();
    }
  });

  // Use jail card
  socket.on("game:useJailCard", () => {
    if (engine.useJailCard(playerId)) {
      broadcastState();
    }
  });

  // End turn
  socket.on("game:endTurn", () => {
    if (engine.getActivePlayer().id !== playerId) return;
    if (engine.endTurn()) {
      broadcastState();
    }
  });

  // Bankruptcy
  socket.on("game:declareBankruptcy", () => {
    engine.declareBankruptcy(playerId);
    broadcastState();
  });

  // Propose trade
  socket.on("game:proposeTrade", (payload: Omit<TradeOffer, "id" | "status" | "createdAt">) => {
    const offer: TradeOffer = {
      ...payload,
      id: `trade_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      status: "pending",
      createdAt: Date.now(),
    };
    if (engine.proposeTrade(offer)) {
      io.to(room.id).emit("game:tradeOffered", offer);
      broadcastState();
    }
  });

  // Respond to trade
  socket.on("game:respondTrade", (payload: { tradeId: string; accept: boolean }) => {
    if (engine.respondTrade(payload.tradeId, playerId, payload.accept)) {
      broadcastState();
    }
  });

  // Chat message & quick emojis
  socket.on("game:sendChat", (payload: { message: string; emoji?: string }) => {
    const chatMsg = room.addChatMessage(playerId, payload.message, payload.emoji);
    io.to(room.id).emit("game:chatMessage", chatMsg);
  });
}
