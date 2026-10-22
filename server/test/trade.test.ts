import { describe, it, expect } from "vitest";
import { validateTradeOffer, executeTrade } from "../src/engine/trade.js";
import { Player, PropertyState, TradeOffer } from "../src/types/index.js";

describe("Trade System", () => {
  it("validates and executes cash and property trades successfully", () => {
    const players: Record<string, Player> = {
      p1: {
        id: "p1",
        socketId: null,
        nickname: "Alice",
        token: "top_hat",
        cash: 1000,
        position: 0,
        inJail: false,
        jailTurns: 0,
        getOutOfJailCards: 1,
        isBankrupt: false,
        isConnected: true,
        isReady: true,
        lastActive: Date.now(),
      },
      p2: {
        id: "p2",
        socketId: null,
        nickname: "Bob",
        token: "scottie_dog",
        cash: 500,
        position: 0,
        inJail: false,
        jailTurns: 0,
        getOutOfJailCards: 0,
        isBankrupt: false,
        isConnected: true,
        isReady: true,
        lastActive: Date.now(),
      },
    };

    const properties: Record<number, PropertyState> = {
      1: { ownerId: "p1", houses: 0, isMortgaged: false }, // Mediterranean
      39: { ownerId: "p2", houses: 0, isMortgaged: false }, // Boardwalk
    };

    const offer: TradeOffer = {
      id: "trade-1",
      fromPlayerId: "p1",
      toPlayerId: "p2",
      offeredCash: 200,
      offeredProperties: [1],
      offeredJailCards: 1,
      requestedCash: 100,
      requestedProperties: [39],
      requestedJailCards: 0,
      status: "pending",
      createdAt: Date.now(),
    };

    const validation = validateTradeOffer(offer, players, properties);
    expect(validation.valid).toBe(true);

    executeTrade(offer, players, properties);

    // Verify Alice (p1): cash 1000 - 200 + 100 = 900
    expect(players.p1!.cash).toBe(900);
    expect(players.p1!.getOutOfJailCards).toBe(0);
    expect(properties[39]!.ownerId).toBe("p1");

    // Verify Bob (p2): cash 500 + 200 - 100 = 600
    expect(players.p2!.cash).toBe(600);
    expect(players.p2!.getOutOfJailCards).toBe(1);
    expect(properties[1]!.ownerId).toBe("p2");
  });

  it("rejects trades if player has insufficient cash or cards", () => {
    const players: Record<string, Player> = {
      p1: {
        id: "p1",
        socketId: null,
        nickname: "Alice",
        token: "top_hat",
        cash: 50,
        position: 0,
        inJail: false,
        jailTurns: 0,
        getOutOfJailCards: 0,
        isBankrupt: false,
        isConnected: true,
        isReady: true,
        lastActive: Date.now(),
      },
      p2: {
        id: "p2",
        socketId: null,
        nickname: "Bob",
        token: "scottie_dog",
        cash: 500,
        position: 0,
        inJail: false,
        jailTurns: 0,
        getOutOfJailCards: 0,
        isBankrupt: false,
        isConnected: true,
        isReady: true,
        lastActive: Date.now(),
      },
    };

    const offer: TradeOffer = {
      id: "trade-2",
      fromPlayerId: "p1",
      toPlayerId: "p2",
      offeredCash: 200, // Alice only has 50
      offeredProperties: [],
      offeredJailCards: 0,
      requestedCash: 0,
      requestedProperties: [],
      requestedJailCards: 0,
      status: "pending",
      createdAt: Date.now(),
    };

    const validation = validateTradeOffer(offer, players, {});
    expect(validation.valid).toBe(false);
    expect(validation.reason).toContain("does not have enough cash");
  });

  it("rejects trades if properties have houses on them", () => {
    const players: Record<string, Player> = {
      p1: {
        id: "p1",
        socketId: null,
        nickname: "Alice",
        token: "top_hat",
        cash: 500,
        position: 0,
        inJail: false,
        jailTurns: 0,
        getOutOfJailCards: 0,
        isBankrupt: false,
        isConnected: true,
        isReady: true,
        lastActive: Date.now(),
      },
      p2: {
        id: "p2",
        socketId: null,
        nickname: "Bob",
        token: "scottie_dog",
        cash: 500,
        position: 0,
        inJail: false,
        jailTurns: 0,
        getOutOfJailCards: 0,
        isBankrupt: false,
        isConnected: true,
        isReady: true,
        lastActive: Date.now(),
      },
    };

    const properties: Record<number, PropertyState> = {
      1: { ownerId: "p1", houses: 1, isMortgaged: false },
      3: { ownerId: "p1", houses: 0, isMortgaged: false },
    };

    const offer: TradeOffer = {
      id: "trade-3",
      fromPlayerId: "p1",
      toPlayerId: "p2",
      offeredCash: 0,
      offeredProperties: [3],
      offeredJailCards: 0,
      requestedCash: 0,
      requestedProperties: [],
      requestedJailCards: 0,
      status: "pending",
      createdAt: Date.now(),
    };

    const validation = validateTradeOffer(offer, players, properties);
    expect(validation.valid).toBe(false);
    expect(validation.reason).toContain("buildings exist");
  });
});
