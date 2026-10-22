import { describe, it, expect, beforeEach } from "vitest";
import { GameEngine } from "../src/engine/GameEngine.js";

describe("GameEngine Core Mechanics", () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine("room-1", "TEST", "p1", {
      turnTimerSeconds: 0,
      freeParkingJackpot: true,
      doubleGoBonus: true,
      auctionsEnabled: true,
    });
    engine.addPlayer("p1", "Alice", "top_hat");
    engine.addPlayer("p2", "Bob", "scottie_dog");
  });

  it("initializes lobby and starts game with initial cash", () => {
    expect(engine.state.status).toBe("LOBBY");
    expect(engine.state.playerOrder.length).toBe(2);

    const started = engine.startGame();
    expect(started).toBe(true);
    expect(engine.state.status).toBe("PLAYING");

    expect(engine.state.players.p1!.cash).toBe(1500);
    expect(engine.state.players.p2!.cash).toBe(1500);
  });

  it("moves player on roll and awards $200 for passing GO", () => {
    engine.startGame();
    const activePlayer = engine.getActivePlayer();
    activePlayer.position = 38; // Luxury Tax

    // Roll total of 5 (e.g. 2 + 3) -> Lands on Mediterranean (position 3) passing GO
    engine.rollDice([2, 3]);

    expect(activePlayer.position).toBe(3);
    // 1500 initial + 200 for passing GO
    expect(activePlayer.cash).toBe(1700);
  });

  it("awards double GO bonus ($400 total) when landing directly on GO with house rule", () => {
    engine.startGame();
    const activePlayer = engine.getActivePlayer();
    activePlayer.position = 36; // Chance

    // Roll 4 (1 + 3) lands directly on GO (position 0)
    engine.rollDice([1, 3]);

    expect(activePlayer.position).toBe(0);
    // 1500 + 200 pass GO + 200 direct landing = 1900
    expect(activePlayer.cash).toBe(1900);
  });

  it("sends player to jail on 3 consecutive doubles", () => {
    engine.startGame();
    const activePlayer = engine.getActivePlayer();

    engine.rollDice([2, 2]); // 1st double
    expect(engine.state.consecutiveDoubles).toBe(1);
    engine.endTurn(); // gets another roll due to doubles

    engine.rollDice([4, 4]); // 2nd double
    expect(engine.state.consecutiveDoubles).toBe(2);
    engine.endTurn();

    engine.rollDice([6, 6]); // 3rd double
    expect(activePlayer.inJail).toBe(true);
    expect(activePlayer.position).toBe(10);
  });

  it("allows player to buy unowned property", () => {
    engine.startGame();
    const activePlayer = engine.getActivePlayer();
    activePlayer.position = 0;

    // Roll 1 + 2 = 3 (Baltic Avenue, costs $60)
    engine.rollDice([1, 2]);
    expect(engine.state.turnPhase).toBe("BUY_DECISION");

    const bought = engine.buyProperty();
    expect(bought).toBe(true);
    expect(activePlayer.cash).toBe(1500 - 60);
    expect(engine.state.properties[3]!.ownerId).toBe(activePlayer.id);
  });

  it("triggers auction when player declines to buy property", () => {
    engine.startGame();
    const activePlayer = engine.getActivePlayer();
    activePlayer.position = 0;

    engine.rollDice([1, 2]); // Lands on Baltic Ave
    expect(engine.state.turnPhase).toBe("BUY_DECISION");

    engine.declineProperty();
    expect(engine.state.turnPhase).toBe("AUCTION");
    expect(engine.state.currentAuction).toBeDefined();
    expect(engine.state.currentAuction!.spaceIndex).toBe(3);

    // Alice bids $50
    engine.placeAuctionBid("p1", 50);
    expect(engine.state.currentAuction!.currentBid).toBe(50);
    expect(engine.state.currentAuction!.highestBidderId).toBe("p1");

    // Bob folds
    engine.foldAuctionBid("p2");

    // Auction resolves, Alice wins Baltic Ave for $50
    expect(engine.state.properties[3]!.ownerId).toBe("p1");
    expect(engine.state.players.p1!.cash).toBe(1500 - 50);
    expect(engine.state.currentAuction).toBeNull();
  });

  it("handles bankruptcy and declares the remaining player the winner", () => {
    engine.startGame();
    const p1 = engine.state.players.p1!;
    const p2 = engine.state.players.p2!;

    // p1 owns Boardwalk with Hotel
    engine.state.properties[39] = { ownerId: "p1", houses: 5, isMortgaged: false };

    // Set p2 to land on Boardwalk with only $100 cash
    p2.position = 35;
    p2.cash = 100;

    // Force p2 to active player
    engine.state.activePlayerIndex = engine.state.playerOrder.indexOf("p2");
    engine.state.turnPhase = "START_TURN";

    // Roll 1 + 3 = 4 -> lands on Boardwalk (39), rent is $2000!
    engine.rollDice([1, 3]);

    expect(engine.state.debtState).toBeDefined();
    expect(engine.state.debtState!.debtorId).toBe("p2");
    expect(engine.state.debtState!.creditorId).toBe("p1");

    // p2 declares bankruptcy
    engine.declareBankruptcy("p2");

    expect(p2.isBankrupt).toBe(true);
    expect(engine.state.winnerId).toBe("p1");
    expect(engine.state.status).toBe("ENDED");
  });
});
