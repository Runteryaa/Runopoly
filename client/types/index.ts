export type PlayerToken =
  | "top_hat"
  | "scottie_dog"
  | "race_car"
  | "battleship"
  | "boot"
  | "thimble"
  | "iron"
  | "wheelbarrow";

export type ColorGroup =
  | "brown"
  | "light_blue"
  | "pink"
  | "orange"
  | "red"
  | "yellow"
  | "green"
  | "dark_blue"
  | "railroad"
  | "utility"
  | "special";

export type SpaceType =
  | "property"
  | "railroad"
  | "utility"
  | "tax"
  | "chance"
  | "community_chest"
  | "go"
  | "jail"
  | "free_parking"
  | "go_to_jail";

export interface BoardSpace {
  id: number;
  name: string;
  type: SpaceType;
  group: ColorGroup;
  cost: number;
  rent: number[];
  houseCost: number;
  mortgageValue: number;
  taxAmount?: number;
}

export interface Player {
  id: string;
  socketId: string | null;
  nickname: string;
  token: PlayerToken;
  cash: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  getOutOfJailCards: number;
  isBankrupt: boolean;
  isConnected: boolean;
  isReady: boolean;
  lastActive: number;
}

export interface PropertyState {
  ownerId: string | null;
  houses: number;
  isMortgaged: boolean;
}

export interface GameRulesConfig {
  turnTimerSeconds: number;
  freeParkingJackpot: boolean;
  doubleGoBonus: boolean;
  auctionsEnabled: boolean;
}

export type CardDeck = "chance" | "community_chest";

export interface Card {
  id: string;
  deck: CardDeck;
  text: string;
  actionType: string;
  destination?: number;
  spaces?: number;
  amount?: number;
  houseCost?: number;
  hotelCost?: number;
}

export interface AuctionState {
  spaceIndex: number;
  currentBid: number;
  highestBidderId: string | null;
  activeBidderIds: string[];
  currentBidderIndex: number;
  deadline: number;
}

export interface TradeOffer {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  offeredCash: number;
  offeredProperties: number[];
  offeredJailCards: number;
  requestedCash: number;
  requestedProperties: number[];
  requestedJailCards: number;
  status: "pending" | "accepted" | "declined" | "countered";
  createdAt: number;
}

export type TurnPhase =
  | "START_TURN"
  | "DICE_ROLLED"
  | "BUY_DECISION"
  | "AUCTION"
  | "CARD_DRAWN"
  | "DEBT_SETTLEMENT"
  | "END_TURN";

export interface DiceRollResult {
  dice: [number, number];
  isDoubles: boolean;
  consecutiveDoubles: number;
}

export interface GameLogEntry {
  id: string;
  timestamp: number;
  message: string;
  playerId?: string;
  type: "info" | "success" | "warning" | "danger";
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  emoji?: string;
  timestamp: number;
}

export interface GameState {
  roomId: string;
  roomCode: string;
  hostId: string;
  status: "LOBBY" | "PLAYING" | "ENDED";
  rules: GameRulesConfig;
  players: Record<string, Player>;
  playerOrder: string[];
  activePlayerIndex: number;
  turnPhase: TurnPhase;
  turnTimerEnd: number | null;
  lastDiceRoll: DiceRollResult | null;
  consecutiveDoubles: number;
  properties: Record<number, PropertyState>;
  freeParkingPot: number;
  chanceDeck: Card[];
  communityChestDeck: Card[];
  activeCard: Card | null;
  currentAuction: AuctionState | null;
  pendingTrade: TradeOffer | null;
  debtState: {
    debtorId: string;
    creditorId: string | null;
    amount: number;
  } | null;
  winnerId: string | null;
  logs: GameLogEntry[];
}
