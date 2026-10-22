import {
  GameState,
  Player,
  PropertyState,
  GameRulesConfig,
  DiceRollResult,
  TurnPhase,
  Card,
  GameLogEntry,
  TradeOffer,
  AuctionState,
} from "../types/index.js";
import { BOARD_SPACES, getSpaceById } from "./board.js";
import { CHANCE_CARDS, COMMUNITY_CHEST_CARDS, shuffleDeck } from "./cards.js";
import {
  calculateRent,
  canBuildHouse,
  canSellHouse,
  canMortgage,
} from "./rent.js";
import { createAuction, placeBid, foldAuction } from "./auction.js";
import { validateTradeOffer, executeTrade } from "./trade.js";

export class GameEngine {
  public state: GameState;

  constructor(
    roomId: string,
    roomCode: string,
    hostId: string,
    rules: Partial<GameRulesConfig> = {}
  ) {
    const defaultRules: GameRulesConfig = {
      turnTimerSeconds: 60,
      freeParkingJackpot: false,
      doubleGoBonus: false,
      auctionsEnabled: true,
      ...rules,
    };

    const initialProperties: Record<number, PropertyState> = {};
    for (const space of BOARD_SPACES) {
      if (
        space.type === "property" ||
        space.type === "railroad" ||
        space.type === "utility"
      ) {
        initialProperties[space.id] = {
          ownerId: null,
          houses: 0,
          isMortgaged: false,
        };
      }
    }

    this.state = {
      roomId,
      roomCode,
      hostId,
      status: "LOBBY",
      rules: defaultRules,
      players: {},
      playerOrder: [],
      activePlayerIndex: 0,
      turnPhase: "START_TURN",
      turnTimerEnd: null,
      lastDiceRoll: null,
      consecutiveDoubles: 0,
      properties: initialProperties,
      freeParkingPot: 0,
      chanceDeck: shuffleDeck(CHANCE_CARDS),
      communityChestDeck: shuffleDeck(COMMUNITY_CHEST_CARDS),
      activeCard: null,
      currentAuction: null,
      pendingTrade: null,
      debtState: null,
      winnerId: null,
      logs: [],
    };
  }

  public log(
    message: string,
    type: "info" | "success" | "warning" | "danger" = "info",
    playerId?: string
  ): void {
    const entry: GameLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      message,
      type,
      playerId,
    };
    this.state.logs.push(entry);
    if (this.state.logs.length > 150) {
      this.state.logs.shift();
    }
  }

  public addPlayer(
    id: string,
    nickname: string,
    token: any,
    socketId: string | null = null
  ): boolean {
    if (this.state.status !== "LOBBY") return false;
    if (this.state.playerOrder.length >= 8) return false;
    if (this.state.players[id]) {
      this.state.players[id]!.isConnected = true;
      this.state.players[id]!.socketId = socketId;
      return true;
    }

    const player: Player = {
      id,
      socketId,
      nickname,
      token,
      cash: 1500,
      position: 0,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      isBankrupt: false,
      isConnected: true,
      isReady: id === this.state.hostId, // Host is ready by default
      lastActive: Date.now(),
    };

    this.state.players[id] = player;
    this.state.playerOrder.push(id);
    this.log(`${nickname} joined the game.`, "info", id);
    return true;
  }

  public removePlayer(id: string): void {
    if (this.state.status === "LOBBY") {
      delete this.state.players[id];
      this.state.playerOrder = this.state.playerOrder.filter((pid) => pid !== id);
      if (this.state.hostId === id && this.state.playerOrder.length > 0) {
        this.state.hostId = this.state.playerOrder[0]!;
      }
    } else {
      if (this.state.players[id]) {
        this.state.players[id]!.isConnected = false;
        this.log(`${this.state.players[id]!.nickname} disconnected.`, "warning", id);
      }
    }
  }

  public startGame(): boolean {
    if (this.state.status !== "LOBBY") return false;
    if (this.state.playerOrder.length < 2) return false;

    // Shuffle player order for randomized turn sequence
    this.state.playerOrder = shuffleDeck(this.state.playerOrder);
    this.state.status = "PLAYING";
    this.state.activePlayerIndex = 0;
    this.state.turnPhase = "START_TURN";
    this.resetTurnTimer();

    const firstPlayer = this.getActivePlayer();
    this.log(`Game started! ${firstPlayer.nickname}'s turn to roll.`, "success");
    return true;
  }

  public getActivePlayer(): Player {
    const activeId = this.state.playerOrder[this.state.activePlayerIndex]!;
    return this.state.players[activeId]!;
  }

  public resetTurnTimer(): void {
    if (this.state.rules.turnTimerSeconds > 0) {
      this.state.turnTimerEnd = Date.now() + this.state.rules.turnTimerSeconds * 1000;
    } else {
      this.state.turnTimerEnd = null;
    }
  }

  public rollDice(
    overrideDice?: [number, number]
  ): { dice: [number, number]; isDoubles: boolean } | null {
    if (this.state.status !== "PLAYING") return null;
    if (this.state.turnPhase !== "START_TURN") return null;

    const player = this.getActivePlayer();
    const d1 = overrideDice ? overrideDice[0] : Math.floor(Math.random() * 6) + 1;
    const d2 = overrideDice ? overrideDice[1] : Math.floor(Math.random() * 6) + 1;
    const isDoubles = d1 === d2;
    const rollTotal = d1 + d2;

    this.state.lastDiceRoll = {
      dice: [d1, d2],
      isDoubles,
      consecutiveDoubles: isDoubles ? this.state.consecutiveDoubles + 1 : 0,
    };

    this.log(`${player.nickname} rolled ${d1} and ${d2} (${rollTotal})${isDoubles ? " [DOUBLES!]" : ""}.`, "info", player.id);

    // 1. Player is in JAIL
    if (player.inJail) {
      if (isDoubles) {
        player.inJail = false;
        player.jailTurns = 0;
        this.state.consecutiveDoubles = 0;
        this.log(`${player.nickname} rolled doubles and got out of Jail!`, "success", player.id);
        this.movePlayer(player, rollTotal);
      } else {
        player.jailTurns++;
        if (player.jailTurns >= 3) {
          this.log(`${player.nickname} spent 3 turns in Jail, pays $50 fine.`, "warning", player.id);
          this.deductCashOrDebt(player, 50, null);
          player.inJail = false;
          player.jailTurns = 0;
          this.movePlayer(player, rollTotal);
        } else {
          this.log(`${player.nickname} remains in Jail (turn ${player.jailTurns}/3).`, "info", player.id);
          this.state.turnPhase = "END_TURN";
        }
      }
      return { dice: [d1, d2], isDoubles };
    }

    // 2. Normal rolling - check 3 consecutive doubles
    if (isDoubles) {
      this.state.consecutiveDoubles++;
      if (this.state.consecutiveDoubles >= 3) {
        this.log(`${player.nickname} rolled 3 doubles in a row! Sent to Jail!`, "danger", player.id);
        this.sendToJail(player);
        return { dice: [d1, d2], isDoubles };
      }
    } else {
      this.state.consecutiveDoubles = 0;
    }

    // Move player
    this.movePlayer(player, rollTotal);
    return { dice: [d1, d2], isDoubles };
  }

  public movePlayer(player: Player, spaces: number): void {
    const oldPosition = player.position;
    const newPosition = (oldPosition + spaces + 40) % 40;
    player.position = newPosition;

    // Check passing GO
    if (spaces > 0 && newPosition < oldPosition) {
      player.cash += 200;
      this.log(`${player.nickname} passed GO and collected $200.`, "success", player.id);
    }

    this.handleSpaceLanding(player, newPosition);
  }

  public teleportPlayer(player: Player, destination: number, canCollectGo = true): void {
    const oldPosition = player.position;
    player.position = destination;

    if (canCollectGo && destination < oldPosition && destination !== 10) {
      player.cash += 200;
      this.log(`${player.nickname} passed GO and collected $200.`, "success", player.id);
    }

    this.handleSpaceLanding(player, destination);
  }

  private handleSpaceLanding(player: Player, spaceIndex: number): void {
    const space = getSpaceById(spaceIndex);
    this.log(`${player.nickname} landed on ${space.name}.`, "info", player.id);

    // GO Space direct landing bonus
    if (space.type === "go") {
      if (this.state.rules.doubleGoBonus) {
        player.cash += 200; // Extra $200 for landing exactly on GO ($400 total)
        this.log(`${player.nickname} landed directly on GO and earned a double bonus ($400)!`, "success", player.id);
      }
      this.state.turnPhase = "END_TURN";
      return;
    }

    // Property, Railroad, Utility
    if (
      space.type === "property" ||
      space.type === "railroad" ||
      space.type === "utility"
    ) {
      const propState = this.state.properties[spaceIndex];
      if (!propState || !propState.ownerId) {
        // Unowned property: Prompt buy or auction
        this.state.turnPhase = "BUY_DECISION";
        return;
      }

      if (propState.ownerId === player.id) {
        this.log(`${player.nickname} already owns ${space.name}.`, "info", player.id);
        this.state.turnPhase = "END_TURN";
        return;
      }

      // Rent payment to owner
      const owner = this.state.players[propState.ownerId];
      if (!owner || owner.isBankrupt) {
        this.state.turnPhase = "END_TURN";
        return;
      }

      const diceTotal = this.state.lastDiceRoll
        ? this.state.lastDiceRoll.dice[0] + this.state.lastDiceRoll.dice[1]
        : 7;

      const rentResult = calculateRent({
        spaceId: spaceIndex,
        properties: this.state.properties,
        diceRollTotal: diceTotal,
      });

      if (rentResult.amount > 0) {
        this.log(`${player.nickname} owes $${rentResult.amount} rent to ${owner.nickname} (${rentResult.reason}).`, "warning", player.id);
        this.deductCashOrDebt(player, rentResult.amount, owner.id);
      } else {
        this.log(`No rent due on ${space.name} (${rentResult.reason}).`, "info", player.id);
      }

      this.state.turnPhase = "END_TURN";
      return;
    }

    // Taxes
    if (space.type === "tax") {
      const taxDue = space.taxAmount || 100;
      this.log(`${player.nickname} pays $${taxDue} in ${space.name}.`, "warning", player.id);
      if (this.state.rules.freeParkingJackpot) {
        this.state.freeParkingPot += taxDue;
      }
      this.deductCashOrDebt(player, taxDue, null);
      this.state.turnPhase = "END_TURN";
      return;
    }

    // Free Parking
    if (space.type === "free_parking") {
      if (this.state.rules.freeParkingJackpot && this.state.freeParkingPot > 0) {
        player.cash += this.state.freeParkingPot;
        this.log(`${player.nickname} landed on Free Parking and won the jackpot of $${this.state.freeParkingPot}!`, "success", player.id);
        this.state.freeParkingPot = 0;
      } else {
        this.log(`${player.nickname} is resting at Free Parking.`, "info", player.id);
      }
      this.state.turnPhase = "END_TURN";
      return;
    }

    // Go To Jail
    if (space.type === "go_to_jail") {
      this.log(`${player.nickname} landed on Go To Jail!`, "danger", player.id);
      this.sendToJail(player);
      return;
    }

    // Chance & Community Chest
    if (space.type === "chance" || space.type === "community_chest") {
      this.drawCard(player, space.type);
      return;
    }

    this.state.turnPhase = "END_TURN";
  }

  public buyProperty(): boolean {
    if (this.state.turnPhase !== "BUY_DECISION") return false;

    const player = this.getActivePlayer();
    const space = getSpaceById(player.position);
    const propState = this.state.properties[space.id];

    if (!propState || propState.ownerId !== null) return false;
    if (player.cash < space.cost) {
      this.log(`${player.nickname} cannot afford ${space.name} ($${space.cost}).`, "warning", player.id);
      return false;
    }

    player.cash -= space.cost;
    propState.ownerId = player.id;
    this.log(`${player.nickname} purchased ${space.name} for $${space.cost}.`, "success", player.id);

    this.state.turnPhase = "END_TURN";
    return true;
  }

  public declineProperty(): boolean {
    if (this.state.turnPhase !== "BUY_DECISION") return false;

    const player = this.getActivePlayer();
    const space = getSpaceById(player.position);
    this.log(`${player.nickname} declined to buy ${space.name}.`, "info", player.id);

    if (this.state.rules.auctionsEnabled) {
      this.startAuction(space.id);
    } else {
      this.state.turnPhase = "END_TURN";
    }
    return true;
  }

  public startAuction(spaceId: number): void {
    const activePlayers = Object.values(this.state.players);
    this.state.currentAuction = createAuction(spaceId, activePlayers);
    this.state.turnPhase = "AUCTION";
    const space = getSpaceById(spaceId);
    this.log(`Auction started for ${space.name}! Bidding opens.`, "warning");
  }

  public placeAuctionBid(playerId: string, amount: number): boolean {
    if (this.state.turnPhase !== "AUCTION" || !this.state.currentAuction) return false;
    const player = this.state.players[playerId];
    if (!player) return false;

    const res = placeBid(this.state.currentAuction, playerId, amount, player.cash);
    if (res.success) {
      this.log(`${player.nickname} bid $${amount} on ${getSpaceById(this.state.currentAuction.spaceIndex).name}.`, "info", playerId);
    }
    return res.success;
  }

  public foldAuctionBid(playerId: string): void {
    if (this.state.turnPhase !== "AUCTION" || !this.state.currentAuction) return;
    const player = this.state.players[playerId];
    if (!player) return;

    this.log(`${player.nickname} passed on the auction.`, "info", playerId);
    const result = foldAuction(this.state.currentAuction, playerId);

    if (result.isAuctionOver) {
      this.finalizeAuction(result.winnerId, result.winningBid);
    }
  }

  private finalizeAuction(winnerId: string | null, winningBid: number): void {
    const auction = this.state.currentAuction;
    if (!auction) return;

    const space = getSpaceById(auction.spaceIndex);
    if (winnerId && winningBid > 0) {
      const winner = this.state.players[winnerId]!;
      winner.cash -= winningBid;
      this.state.properties[space.id]!.ownerId = winner.id;
      this.log(`${winner.nickname} won the auction for ${space.name} at $${winningBid}!`, "success", winner.id);
    } else {
      this.log(`No bids placed on ${space.name}. It remains unowned.`, "info");
    }

    this.state.currentAuction = null;
    this.state.turnPhase = "END_TURN";
  }

  public sendToJail(player: Player): void {
    player.position = 10;
    player.inJail = true;
    player.jailTurns = 0;
    this.state.consecutiveDoubles = 0;
    this.state.turnPhase = "END_TURN";
    this.log(`${player.nickname} is sent to Jail!`, "danger", player.id);
  }

  public payJailFine(playerId: string): boolean {
    const player = this.state.players[playerId];
    if (!player || !player.inJail) return false;
    if (player.cash < 50) return false;

    player.cash -= 50;
    player.inJail = false;
    player.jailTurns = 0;
    if (this.state.rules.freeParkingJackpot) {
      this.state.freeParkingPot += 50;
    }
    this.log(`${player.nickname} paid $50 fine and is now out of Jail.`, "success", player.id);
    return true;
  }

  public useJailCard(playerId: string): boolean {
    const player = this.state.players[playerId];
    if (!player || !player.inJail || player.getOutOfJailCards <= 0) return false;

    player.getOutOfJailCards--;
    player.inJail = false;
    player.jailTurns = 0;
    this.log(`${player.nickname} used a 'Get Out of Jail Free' card!`, "success", player.id);
    return true;
  }

  public drawCard(player: Player, deckType: "chance" | "community_chest"): void {
    let deck = deckType === "chance" ? this.state.chanceDeck : this.state.communityChestDeck;
    if (deck.length === 0) {
      deck = deckType === "chance" ? shuffleDeck(CHANCE_CARDS) : shuffleDeck(COMMUNITY_CHEST_CARDS);
      if (deckType === "chance") this.state.chanceDeck = deck;
      else this.state.communityChestDeck = deck;
    }

    const card = deck.shift()!;
    this.state.activeCard = card;
    this.log(`${player.nickname} drew ${deckType === "chance" ? "Chance" : "Community Chest"}: "${card.text}"`, "info", player.id);

    this.resolveCard(player, card);
  }

  private resolveCard(player: Player, card: Card): void {
    switch (card.actionType) {
      case "MOVE_TO":
        if (card.destination !== undefined) {
          this.teleportPlayer(player, card.destination, true);
        }
        break;
      case "MOVE_SPACES":
        if (card.spaces !== undefined) {
          this.movePlayer(player, card.spaces);
        }
        break;
      case "RECEIVE_CASH":
        if (card.amount) {
          player.cash += card.amount;
        }
        this.state.turnPhase = "END_TURN";
        break;
      case "PAY_CASH":
        if (card.amount) {
          if (this.state.rules.freeParkingJackpot) {
            this.state.freeParkingPot += card.amount;
          }
          this.deductCashOrDebt(player, card.amount, null);
        }
        this.state.turnPhase = "END_TURN";
        break;
      case "GET_OUT_OF_JAIL_FREE":
        player.getOutOfJailCards++;
        this.state.turnPhase = "END_TURN";
        break;
      case "GO_TO_JAIL":
        this.sendToJail(player);
        break;
      case "PAY_EACH_PLAYER":
        if (card.amount) {
          const others = Object.values(this.state.players).filter(
            (p) => p.id !== player.id && !p.isBankrupt
          );
          const totalCost = others.length * card.amount;
          this.deductCashOrDebt(player, totalCost, null);
          for (const other of others) {
            other.cash += card.amount;
          }
        }
        this.state.turnPhase = "END_TURN";
        break;
      case "COLLECT_FROM_EACH_PLAYER":
        if (card.amount) {
          const others = Object.values(this.state.players).filter(
            (p) => p.id !== player.id && !p.isBankrupt
          );
          for (const other of others) {
            this.deductCashOrDebt(other, card.amount, player.id);
          }
        }
        this.state.turnPhase = "END_TURN";
        break;
      case "PAY_PER_BUILDING": {
        let total = 0;
        for (const [idStr, prop] of Object.entries(this.state.properties)) {
          if (prop.ownerId === player.id) {
            if (prop.houses === 5) {
              total += card.hotelCost || 100;
            } else {
              total += prop.houses * (card.houseCost || 25);
            }
          }
        }
        if (total > 0) {
          if (this.state.rules.freeParkingJackpot) {
            this.state.freeParkingPot += total;
          }
          this.deductCashOrDebt(player, total, null);
        }
        this.state.turnPhase = "END_TURN";
        break;
      }
      case "NEAREST_RAILROAD": {
        const railroads = [5, 15, 25, 35];
        const current = player.position;
        let dest = railroads[0]!;
        for (const r of railroads) {
          if (r > current) {
            dest = r;
            break;
          }
        }
        this.teleportPlayer(player, dest, true);
        break;
      }
      case "NEAREST_UTILITY": {
        const utilities = [12, 28];
        const current = player.position;
        let dest = utilities[0]!;
        for (const u of utilities) {
          if (u > current) {
            dest = u;
            break;
          }
        }
        this.teleportPlayer(player, dest, true);
        break;
      }
      default:
        this.state.turnPhase = "END_TURN";
    }
  }

  public buildHouse(playerId: string, spaceId: number): boolean {
    const check = canBuildHouse(spaceId, playerId, this.state.properties);
    if (!check.canBuild) {
      this.log(`Cannot build house: ${check.reason}`, "warning", playerId);
      return false;
    }

    const space = getSpaceById(spaceId);
    const player = this.state.players[playerId]!;
    if (player.cash < space.houseCost) {
      this.log(`Cannot afford house on ${space.name} ($${space.houseCost}).`, "warning", playerId);
      return false;
    }

    player.cash -= space.houseCost;
    this.state.properties[spaceId]!.houses++;
    const buildingType = this.state.properties[spaceId]!.houses === 5 ? "hotel" : "house";
    this.log(`${player.nickname} built a ${buildingType} on ${space.name} for $${space.houseCost}.`, "success", playerId);
    return true;
  }

  public sellHouse(playerId: string, spaceId: number): boolean {
    const check = canSellHouse(spaceId, playerId, this.state.properties);
    if (!check.canSell) {
      this.log(`Cannot sell house: ${check.reason}`, "warning", playerId);
      return false;
    }

    const space = getSpaceById(spaceId);
    const player = this.state.players[playerId]!;
    const refund = Math.floor(space.houseCost / 2);

    this.state.properties[spaceId]!.houses--;
    player.cash += refund;
    this.log(`${player.nickname} sold a building on ${space.name} for $${refund}.`, "info", playerId);
    return true;
  }

  public mortgageProperty(playerId: string, spaceId: number): boolean {
    const check = canMortgage(spaceId, playerId, this.state.properties);
    if (!check.canMortgage) {
      this.log(`Cannot mortgage property: ${check.reason}`, "warning", playerId);
      return false;
    }

    const space = getSpaceById(spaceId);
    const player = this.state.players[playerId]!;
    this.state.properties[spaceId]!.isMortgaged = true;
    player.cash += space.mortgageValue;
    this.log(`${player.nickname} mortgaged ${space.name} and received $${space.mortgageValue}.`, "info", playerId);
    return true;
  }

  public unmortgageProperty(playerId: string, spaceId: number): boolean {
    const prop = this.state.properties[spaceId];
    if (!prop || prop.ownerId !== playerId || !prop.isMortgaged) return false;

    const space = getSpaceById(spaceId);
    const player = this.state.players[playerId]!;
    const cost = Math.round(space.mortgageValue * 1.1); // Principal + 10% interest
    if (player.cash < cost) {
      this.log(`Cannot afford to unmortgage ${space.name} ($${cost}).`, "warning", playerId);
      return false;
    }

    player.cash -= cost;
    prop.isMortgaged = false;
    this.log(`${player.nickname} unmortgaged ${space.name} for $${cost}.`, "success", playerId);
    return true;
  }

  public proposeTrade(offer: TradeOffer): boolean {
    const check = validateTradeOffer(offer, this.state.players, this.state.properties);
    if (!check.valid) {
      this.log(`Invalid trade proposal: ${check.reason}`, "warning", offer.fromPlayerId);
      return false;
    }

    this.state.pendingTrade = offer;
    const fromP = this.state.players[offer.fromPlayerId]!;
    const toP = this.state.players[offer.toPlayerId]!;
    this.log(`${fromP.nickname} proposed a trade to ${toP.nickname}.`, "info");
    return true;
  }

  public respondTrade(tradeId: string, playerId: string, accept: boolean): boolean {
    const trade = this.state.pendingTrade;
    if (!trade || trade.id !== tradeId || trade.toPlayerId !== playerId) return false;

    const fromP = this.state.players[trade.fromPlayerId]!;
    const toP = this.state.players[trade.toPlayerId]!;

    if (!accept) {
      trade.status = "declined";
      this.state.pendingTrade = null;
      this.log(`${toP.nickname} declined the trade offer from ${fromP.nickname}.`, "info");
      return true;
    }

    // Re-validate right before execution
    const check = validateTradeOffer(trade, this.state.players, this.state.properties);
    if (!check.valid) {
      this.state.pendingTrade = null;
      this.log(`Trade failed: ${check.reason}`, "warning");
      return false;
    }

    executeTrade(trade, this.state.players, this.state.properties);
    trade.status = "accepted";
    this.state.pendingTrade = null;
    this.log(`Trade completed successfully between ${fromP.nickname} and ${toP.nickname}!`, "success");
    return true;
  }

  public deductCashOrDebt(player: Player, amount: number, creditorId: string | null): void {
    if (player.cash >= amount) {
      player.cash -= amount;
      if (creditorId && this.state.players[creditorId]) {
        this.state.players[creditorId]!.cash += amount;
      }
    } else {
      // Outstanding debt
      this.state.debtState = {
        debtorId: player.id,
        creditorId,
        amount,
      };
      this.log(`${player.nickname} cannot afford $${amount}! Must liquidate assets or declare bankruptcy.`, "danger", player.id);
    }
  }

  public declareBankruptcy(playerId: string): void {
    const player = this.state.players[playerId];
    if (!player || player.isBankrupt) return;

    player.isBankrupt = true;
    const creditorId = this.state.debtState?.creditorId;
    const creditor = creditorId ? this.state.players[creditorId] : null;

    if (creditor && !creditor.isBankrupt) {
      // Transfer remaining cash, properties and jail cards to creditor
      creditor.cash += Math.max(0, player.cash);
      creditor.getOutOfJailCards += player.getOutOfJailCards;

      for (const [idStr, prop] of Object.entries(this.state.properties)) {
        if (prop.ownerId === player.id) {
          prop.ownerId = creditor.id;
        }
      }
      this.log(`${player.nickname} declared bankruptcy! All assets transferred to ${creditor.nickname}.`, "danger", player.id);
    } else {
      // Surrender all properties to Bank
      for (const [idStr, prop] of Object.entries(this.state.properties)) {
        if (prop.ownerId === player.id) {
          prop.ownerId = null;
          prop.houses = 0;
          prop.isMortgaged = false;
        }
      }
      this.log(`${player.nickname} declared bankruptcy to the Bank! Properties returned to bank.`, "danger", player.id);
    }

    player.cash = 0;
    player.getOutOfJailCards = 0;
    this.state.debtState = null;

    // Check for game winner
    const activeSurvivors = Object.values(this.state.players).filter((p) => !p.isBankrupt);
    if (activeSurvivors.length === 1) {
      this.state.winnerId = activeSurvivors[0]!.id;
      this.state.status = "ENDED";
      this.log(`🏆 GAME OVER! ${activeSurvivors[0]!.nickname} has won RunoPoly!`, "success", activeSurvivors[0]!.id);
      return;
    }

    if (this.getActivePlayer().id === playerId) {
      this.endTurn();
    }
  }

  public endTurn(): boolean {
    if (this.state.status !== "PLAYING") return false;

    // Check if player rolled doubles (and not jailed or just exited jail)
    const player = this.getActivePlayer();
    if (
      this.state.lastDiceRoll?.isDoubles &&
      !player.inJail &&
      this.state.consecutiveDoubles > 0 &&
      this.state.consecutiveDoubles < 3
    ) {
      this.log(`${player.nickname} gets another turn for rolling doubles!`, "info", player.id);
      this.state.turnPhase = "START_TURN";
      this.resetTurnTimer();
      return true;
    }

    // Reset turn flags
    this.state.consecutiveDoubles = 0;
    this.state.lastDiceRoll = null;
    this.state.activeCard = null;

    // Next active player who is not bankrupt
    const totalPlayers = this.state.playerOrder.length;
    let nextIndex = (this.state.activePlayerIndex + 1) % totalPlayers;
    let attempts = 0;

    while (
      this.state.players[this.state.playerOrder[nextIndex]!]?.isBankrupt &&
      attempts < totalPlayers
    ) {
      nextIndex = (nextIndex + 1) % totalPlayers;
      attempts++;
    }

    this.state.activePlayerIndex = nextIndex;
    this.state.turnPhase = "START_TURN";
    this.resetTurnTimer();

    const nextPlayer = this.getActivePlayer();
    this.log(`It is now ${nextPlayer.nickname}'s turn.`, "info", nextPlayer.id);
    return true;
  }
}
