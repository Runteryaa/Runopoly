import { BOARD_SPACES, COLOR_GROUP_SPACES, getSpaceById } from "./board.js";
import { PropertyState } from "../types/index.js";

export interface RentCalculationParams {
  spaceId: number;
  properties: Record<number, PropertyState>;
  diceRollTotal?: number;
  multiplier?: number; // e.g. 2 for Chance railroad, 10 for Chance utility
}

export function calculateRent(params: RentCalculationParams): {
  amount: number;
  ownerId: string | null;
  reason: string;
} {
  const { spaceId, properties, diceRollTotal = 7, multiplier = 1 } = params;
  const space = getSpaceById(spaceId);
  const propState = properties[spaceId];

  if (!propState || !propState.ownerId) {
    return { amount: 0, ownerId: null, reason: "Unowned property" };
  }

  if (propState.isMortgaged) {
    return { amount: 0, ownerId: propState.ownerId, reason: "Property is mortgaged" };
  }

  const ownerId = propState.ownerId;

  // 1. Railroads
  if (space.type === "railroad") {
    const railroadIds = COLOR_GROUP_SPACES.railroad;
    const ownedRailroads = railroadIds.filter(
      (id) => properties[id]?.ownerId === ownerId
    ).length;

    const baseRailroadRent = [0, 25, 50, 100, 200][ownedRailroads] || 25;
    const finalRent = baseRailroadRent * multiplier;
    return {
      amount: finalRent,
      ownerId,
      reason: `${ownedRailroads} Railroad(s) owned${multiplier > 1 ? ` (${multiplier}x card bonus)` : ""}`,
    };
  }

  // 2. Utilities
  if (space.type === "utility") {
    if (multiplier > 1) {
      // Specific card rule (e.g. Chance card: 10x dice roll)
      const finalRent = diceRollTotal * multiplier;
      return {
        amount: finalRent,
        ownerId,
        reason: `${multiplier}x dice roll (${diceRollTotal})`,
      };
    }

    const utilityIds = COLOR_GROUP_SPACES.utility;
    const ownedUtilities = utilityIds.filter(
      (id) => properties[id]?.ownerId === ownerId
    ).length;

    const utilityMultiplier = ownedUtilities >= 2 ? 10 : 4;
    const finalRent = diceRollTotal * utilityMultiplier;
    return {
      amount: finalRent,
      ownerId,
      reason: `${ownedUtilities} Utility(ies) owned (${utilityMultiplier}x dice total: ${diceRollTotal})`,
    };
  }

  // 3. Regular Color Group Properties
  if (space.type === "property") {
    // If houses/hotels built
    if (propState.houses > 0) {
      const houseRent = space.rent[propState.houses] ?? space.rent[0] ?? 0;
      const typeLabel = propState.houses === 5 ? "Hotel" : `${propState.houses} House(s)`;
      return {
        amount: houseRent,
        ownerId,
        reason: `${typeLabel} on ${space.name}`,
      };
    }

    // Check full color group ownership
    if (space.group !== "special") {
      const groupSpaces = COLOR_GROUP_SPACES[space.group];
      const ownsAll = groupSpaces.every(
        (id) => properties[id]?.ownerId === ownerId
      );

      const baseRent = space.rent[0] ?? 0;
      if (ownsAll) {
        return {
          amount: baseRent * 2,
          ownerId,
          reason: `Monopoly set bonus (2x base rent of $${baseRent})`,
        };
      }

      return {
        amount: baseRent,
        ownerId,
        reason: `Base unimproved rent`,
      };
    }
  }

  return { amount: 0, ownerId, reason: "No rent due" };
}

export function canBuildHouse(
  spaceId: number,
  playerId: string,
  properties: Record<number, PropertyState>
): { canBuild: boolean; reason: string } {
  const space = getSpaceById(spaceId);
  if (space.type !== "property" || space.group === "special") {
    return { canBuild: false, reason: "Can only build houses on color properties." };
  }

  const propState = properties[spaceId];
  if (!propState || propState.ownerId !== playerId) {
    return { canBuild: false, reason: "You do not own this property." };
  }

  if (propState.isMortgaged) {
    return { canBuild: false, reason: "Cannot build on mortgaged property." };
  }

  const groupSpaces = COLOR_GROUP_SPACES[space.group];
  const ownsAll = groupSpaces.every((id) => properties[id]?.ownerId === playerId);
  if (!ownsAll) {
    return { canBuild: false, reason: "Must own all properties in the color group to build." };
  }

  const anyMortgaged = groupSpaces.some((id) => properties[id]?.isMortgaged);
  if (anyMortgaged) {
    return { canBuild: false, reason: "Cannot build if any property in color group is mortgaged." };
  }

  if (propState.houses >= 5) {
    return { canBuild: false, reason: "Maximum buildings reached (Hotel already built)." };
  }

  // Even building rule: cannot build on this space if it already has more houses than another space in the group
  const currentHouses = propState.houses;
  const minHousesInGroup = Math.min(...groupSpaces.map((id) => properties[id]?.houses ?? 0));
  if (currentHouses > minHousesInGroup) {
    return { canBuild: false, reason: "Must build evenly across the color group." };
  }

  return { canBuild: true, reason: "Can build" };
}

export function canSellHouse(
  spaceId: number,
  playerId: string,
  properties: Record<number, PropertyState>
): { canSell: boolean; reason: string } {
  const space = getSpaceById(spaceId);
  if (space.type !== "property" || space.group === "special") {
    return { canSell: false, reason: "Not a buildable property." };
  }

  const propState = properties[spaceId];
  if (!propState || propState.ownerId !== playerId) {
    return { canSell: false, reason: "You do not own this property." };
  }

  if (propState.houses <= 0) {
    return { canSell: false, reason: "No buildings to sell." };
  }

  // Even selling rule: cannot sell if another space in group has more houses
  const groupSpaces = COLOR_GROUP_SPACES[space.group];
  const maxHousesInGroup = Math.max(...groupSpaces.map((id) => properties[id]?.houses ?? 0));
  if (propState.houses < maxHousesInGroup) {
    return { canSell: false, reason: "Must sell houses evenly across the color group." };
  }

  return { canSell: true, reason: "Can sell" };
}

export function canMortgage(
  spaceId: number,
  playerId: string,
  properties: Record<number, PropertyState>
): { canMortgage: boolean; reason: string } {
  const space = getSpaceById(spaceId);
  const propState = properties[spaceId];

  if (!propState || propState.ownerId !== playerId) {
    return { canMortgage: false, reason: "You do not own this property." };
  }

  if (propState.isMortgaged) {
    return { canMortgage: false, reason: "Property is already mortgaged." };
  }

  if (propState.houses > 0) {
    return { canMortgage: false, reason: "Must sell all houses/hotels before mortgaging." };
  }

  if (space.group !== "special" && space.type === "property") {
    const groupSpaces = COLOR_GROUP_SPACES[space.group];
    const anyHousesInGroup = groupSpaces.some(
      (id) => (properties[id]?.houses ?? 0) > 0
    );
    if (anyHousesInGroup) {
      return { canMortgage: false, reason: "Must sell all houses in the color group before mortgaging any property." };
    }
  }

  return { canMortgage: true, reason: "Can mortgage" };
}
