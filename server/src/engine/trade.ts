import { TradeOffer, PropertyState, Player } from "../types/index.js";
import { BOARD_SPACES, COLOR_GROUP_SPACES, getSpaceById } from "./board.js";

export function validateTradeOffer(
  offer: TradeOffer,
  players: Record<string, Player>,
  properties: Record<number, PropertyState>
): { valid: boolean; reason: string } {
  const fromPlayer = players[offer.fromPlayerId];
  const toPlayer = players[offer.toPlayerId];

  if (!fromPlayer || !toPlayer) {
    return { valid: false, reason: "Invalid player(s) in trade." };
  }

  if (fromPlayer.isBankrupt || toPlayer.isBankrupt) {
    return { valid: false, reason: "Bankrupt player cannot trade." };
  }

  // Validate cash
  if (offer.offeredCash < 0 || offer.requestedCash < 0) {
    return { valid: false, reason: "Cash cannot be negative." };
  }
  if (offer.offeredCash > fromPlayer.cash) {
    return { valid: false, reason: `${fromPlayer.nickname} does not have enough cash ($${offer.offeredCash}).` };
  }
  if (offer.requestedCash > toPlayer.cash) {
    return { valid: false, reason: `${toPlayer.nickname} does not have enough cash ($${offer.requestedCash}).` };
  }

  // Validate jail cards
  if (offer.offeredJailCards < 0 || offer.requestedJailCards < 0) {
    return { valid: false, reason: "Jail cards cannot be negative." };
  }
  if (offer.offeredJailCards > fromPlayer.getOutOfJailCards) {
    return { valid: false, reason: "Not enough Get Out of Jail Free cards offered." };
  }
  if (offer.requestedJailCards > toPlayer.getOutOfJailCards) {
    return { valid: false, reason: "Not enough Get Out of Jail Free cards requested." };
  }

  // Validate offered properties
  for (const spaceId of offer.offeredProperties) {
    const prop = properties[spaceId];
    if (!prop || prop.ownerId !== fromPlayer.id) {
      return { valid: false, reason: `${fromPlayer.nickname} does not own space #${spaceId}.` };
    }
    const space = getSpaceById(spaceId);
    if (space.group !== "special" && space.type === "property") {
      const groupSpaces = COLOR_GROUP_SPACES[space.group];
      const hasHouses = groupSpaces.some((id) => (properties[id]?.houses ?? 0) > 0);
      if (hasHouses) {
        return { valid: false, reason: `Cannot trade ${space.name} while buildings exist in the color group.` };
      }
    }
  }

  // Validate requested properties
  for (const spaceId of offer.requestedProperties) {
    const prop = properties[spaceId];
    if (!prop || prop.ownerId !== toPlayer.id) {
      return { valid: false, reason: `${toPlayer.nickname} does not own space #${spaceId}.` };
    }
    const space = getSpaceById(spaceId);
    if (space.group !== "special" && space.type === "property") {
      const groupSpaces = COLOR_GROUP_SPACES[space.group];
      const hasHouses = groupSpaces.some((id) => (properties[id]?.houses ?? 0) > 0);
      if (hasHouses) {
        return { valid: false, reason: `Cannot trade ${space.name} while buildings exist in the color group.` };
      }
    }
  }

  return { valid: true, reason: "Trade is valid" };
}

export function executeTrade(
  offer: TradeOffer,
  players: Record<string, Player>,
  properties: Record<number, PropertyState>
): void {
  const fromPlayer = players[offer.fromPlayerId]!;
  const toPlayer = players[offer.toPlayerId]!;

  // Exchange cash
  fromPlayer.cash -= offer.offeredCash;
  toPlayer.cash += offer.offeredCash;

  toPlayer.cash -= offer.requestedCash;
  fromPlayer.cash += offer.requestedCash;

  // Exchange jail cards
  fromPlayer.getOutOfJailCards -= offer.offeredJailCards;
  toPlayer.getOutOfJailCards += offer.offeredJailCards;

  toPlayer.getOutOfJailCards -= offer.requestedJailCards;
  fromPlayer.getOutOfJailCards += offer.requestedJailCards;

  // Exchange properties
  for (const spaceId of offer.offeredProperties) {
    const prop = properties[spaceId];
    if (prop) {
      prop.ownerId = toPlayer.id;
    }
  }

  for (const spaceId of offer.requestedProperties) {
    const prop = properties[spaceId];
    if (prop) {
      prop.ownerId = fromPlayer.id;
    }
  }
}
