import { describe, it, expect } from "vitest";
import {
  calculateRent,
  canBuildHouse,
  canSellHouse,
  canMortgage,
} from "../src/engine/rent.js";
import { PropertyState } from "../src/types/index.js";

describe("Rent Calculation & Property Rules", () => {
  it("calculates zero rent for unowned or mortgaged properties", () => {
    const properties: Record<number, PropertyState> = {};
    const unownedRent = calculateRent({
      spaceId: 1, // Mediterranean Ave
      properties,
    });
    expect(unownedRent.amount).toBe(0);

    properties[1] = { ownerId: "player1", houses: 0, isMortgaged: true };
    const mortgagedRent = calculateRent({
      spaceId: 1,
      properties,
    });
    expect(mortgagedRent.amount).toBe(0);
  });

  it("calculates unimproved base rent and monopoly doubled rent", () => {
    const properties: Record<number, PropertyState> = {
      1: { ownerId: "player1", houses: 0, isMortgaged: false }, // Mediterranean
      3: { ownerId: "player2", houses: 0, isMortgaged: false }, // Baltic
    };

    // Unimproved, not full monopoly
    const singleRent = calculateRent({ spaceId: 1, properties });
    expect(singleRent.amount).toBe(2);

    // Full brown monopoly owned by player1
    properties[3]!.ownerId = "player1";
    const monopolyRent = calculateRent({ spaceId: 1, properties });
    expect(monopolyRent.amount).toBe(4); // 2 * 2 = 4
  });

  it("calculates house and hotel rents correctly", () => {
    const properties: Record<number, PropertyState> = {
      1: { ownerId: "player1", houses: 1, isMortgaged: false }, // 1 house ($10)
      3: { ownerId: "player1", houses: 5, isMortgaged: false }, // Hotel ($450)
    };

    const oneHouseRent = calculateRent({ spaceId: 1, properties });
    expect(oneHouseRent.amount).toBe(10);

    const hotelRent = calculateRent({ spaceId: 3, properties });
    expect(hotelRent.amount).toBe(450);
  });

  it("calculates railroad rents based on count owned and card multipliers", () => {
    const properties: Record<number, PropertyState> = {
      5: { ownerId: "p1", houses: 0, isMortgaged: false }, // Reading
    };

    expect(calculateRent({ spaceId: 5, properties }).amount).toBe(25);

    // 2 railroads
    properties[15] = { ownerId: "p1", houses: 0, isMortgaged: false }; // Pennsylvania
    expect(calculateRent({ spaceId: 5, properties }).amount).toBe(50);

    // 3 railroads
    properties[25] = { ownerId: "p1", houses: 0, isMortgaged: false }; // B.&O.
    expect(calculateRent({ spaceId: 5, properties }).amount).toBe(100);

    // 4 railroads
    properties[35] = { ownerId: "p1", houses: 0, isMortgaged: false }; // Short Line
    expect(calculateRent({ spaceId: 5, properties }).amount).toBe(200);

    // Chance card 2x multiplier
    expect(
      calculateRent({ spaceId: 5, properties, multiplier: 2 }).amount
    ).toBe(400);
  });

  it("calculates utility rents based on dice roll and count owned", () => {
    const properties: Record<number, PropertyState> = {
      12: { ownerId: "p1", houses: 0, isMortgaged: false }, // Electric Co.
    };

    // 1 utility owned: 4x dice
    expect(
      calculateRent({ spaceId: 12, properties, diceRollTotal: 8 }).amount
    ).toBe(32);

    // Both utilities owned: 10x dice
    properties[28] = { ownerId: "p1", houses: 0, isMortgaged: false }; // Water Works
    expect(
      calculateRent({ spaceId: 12, properties, diceRollTotal: 8 }).amount
    ).toBe(80);

    // Card 10x multiplier
    expect(
      calculateRent({ spaceId: 12, properties, diceRollTotal: 6, multiplier: 10 })
        .amount
    ).toBe(60);
  });

  it("enforces even building rule for houses", () => {
    const properties: Record<number, PropertyState> = {
      1: { ownerId: "p1", houses: 0, isMortgaged: false },
      3: { ownerId: "p1", houses: 0, isMortgaged: false },
    };

    // Can build on Mediterranean
    expect(canBuildHouse(1, "p1", properties).canBuild).toBe(true);

    // Now Mediterranean has 1 house, Baltic has 0
    properties[1]!.houses = 1;

    // Mediterranean cannot build a 2nd house until Baltic has 1 (even building)
    expect(canBuildHouse(1, "p1", properties).canBuild).toBe(false);
    expect(canBuildHouse(3, "p1", properties).canBuild).toBe(true);
  });

  it("enforces mortgaging restrictions when houses exist", () => {
    const properties: Record<number, PropertyState> = {
      1: { ownerId: "p1", houses: 1, isMortgaged: false },
      3: { ownerId: "p1", houses: 0, isMortgaged: false },
    };

    // Cannot mortgage if any houses exist in the group
    expect(canMortgage(3, "p1", properties).canMortgage).toBe(false);

    properties[1]!.houses = 0;
    expect(canMortgage(3, "p1", properties).canMortgage).toBe(true);
  });
});
