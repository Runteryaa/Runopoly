import { Card } from "../types/index.js";

export const CHANCE_CARDS: Card[] = [
  {
    id: "ch-advance-go",
    deck: "chance",
    text: "Advance to GO. (Collect $200)",
    actionType: "MOVE_TO",
    destination: 0,
  },
  {
    id: "ch-advance-illinois",
    deck: "chance",
    text: "Advance to Illinois Avenue. If you pass GO, collect $200.",
    actionType: "MOVE_TO",
    destination: 24,
  },
  {
    id: "ch-advance-st-charles",
    deck: "chance",
    text: "Advance to St. Charles Place. If you pass GO, collect $200.",
    actionType: "MOVE_TO",
    destination: 11,
  },
  {
    id: "ch-nearest-utility",
    deck: "chance",
    text: "Advance token to the nearest Utility. If unowned, you may buy it from the Bank. If owned, throw dice and pay owner 10 times the amount thrown.",
    actionType: "NEAREST_UTILITY",
  },
  {
    id: "ch-nearest-railroad-1",
    deck: "chance",
    text: "Advance token to the nearest Railroad. If unowned, you may buy it. If owned, pay owner twice the rental to which they are otherwise entitled.",
    actionType: "NEAREST_RAILROAD",
  },
  {
    id: "ch-nearest-railroad-2",
    deck: "chance",
    text: "Advance token to the nearest Railroad. If unowned, you may buy it. If owned, pay owner twice the rental to which they are otherwise entitled.",
    actionType: "NEAREST_RAILROAD",
  },
  {
    id: "ch-dividend",
    deck: "chance",
    text: "Bank pays you dividend of $50.",
    actionType: "RECEIVE_CASH",
    amount: 50,
  },
  {
    id: "ch-jail-free",
    deck: "chance",
    text: "Get Out of Jail Free. This card may be kept until needed or traded.",
    actionType: "GET_OUT_OF_JAIL_FREE",
  },
  {
    id: "ch-back-three",
    deck: "chance",
    text: "Go Back 3 Spaces.",
    actionType: "MOVE_SPACES",
    spaces: -3,
  },
  {
    id: "ch-go-to-jail",
    deck: "chance",
    text: "Go to Jail. Go directly to Jail, do not pass GO, do not collect $200.",
    actionType: "GO_TO_JAIL",
  },
  {
    id: "ch-repairs",
    deck: "chance",
    text: "Make general repairs on all your property. For each house pay $25, for each hotel pay $100.",
    actionType: "PAY_PER_BUILDING",
    houseCost: 25,
    hotelCost: 100,
  },
  {
    id: "ch-speeding-fine",
    deck: "chance",
    text: "Speeding fine. Pay $15.",
    actionType: "PAY_CASH",
    amount: 15,
  },
  {
    id: "ch-reading-railroad",
    deck: "chance",
    text: "Take a trip to Reading Railroad. If you pass GO, collect $200.",
    actionType: "MOVE_TO",
    destination: 5,
  },
  {
    id: "ch-boardwalk",
    deck: "chance",
    text: "Advance to Boardwalk.",
    actionType: "MOVE_TO",
    destination: 39,
  },
  {
    id: "ch-chairman",
    deck: "chance",
    text: "You have been elected Chairman of the Board. Pay each player $50.",
    actionType: "PAY_EACH_PLAYER",
    amount: 50,
  },
  {
    id: "ch-loan-matures",
    deck: "chance",
    text: "Your building loan matures. Collect $150.",
    actionType: "RECEIVE_CASH",
    amount: 150,
  },
];

export const COMMUNITY_CHEST_CARDS: Card[] = [
  {
    id: "cc-advance-go",
    deck: "community_chest",
    text: "Advance to GO. (Collect $200)",
    actionType: "MOVE_TO",
    destination: 0,
  },
  {
    id: "cc-bank-error",
    deck: "community_chest",
    text: "Bank error in your favor. Collect $200.",
    actionType: "RECEIVE_CASH",
    amount: 200,
  },
  {
    id: "cc-doctor-fee",
    deck: "community_chest",
    text: "Doctor's fees. Pay $50.",
    actionType: "PAY_CASH",
    amount: 50,
  },
  {
    id: "cc-stock-sale",
    deck: "community_chest",
    text: "From sale of stock you get $50.",
    actionType: "RECEIVE_CASH",
    amount: 50,
  },
  {
    id: "cc-jail-free",
    deck: "community_chest",
    text: "Get Out of Jail Free. This card may be kept until needed or traded.",
    actionType: "GET_OUT_OF_JAIL_FREE",
  },
  {
    id: "cc-go-to-jail",
    deck: "community_chest",
    text: "Go to Jail. Go directly to Jail, do not pass GO, do not collect $200.",
    actionType: "GO_TO_JAIL",
  },
  {
    id: "cc-holiday-fund",
    deck: "community_chest",
    text: "Holiday fund matures. Receive $100.",
    actionType: "RECEIVE_CASH",
    amount: 100,
  },
  {
    id: "cc-tax-refund",
    deck: "community_chest",
    text: "Income tax refund. Collect $20.",
    actionType: "RECEIVE_CASH",
    amount: 20,
  },
  {
    id: "cc-birthday",
    deck: "community_chest",
    text: "It is your birthday. Collect $10 from every player.",
    actionType: "COLLECT_FROM_EACH_PLAYER",
    amount: 10,
  },
  {
    id: "cc-life-insurance",
    deck: "community_chest",
    text: "Life insurance matures. Collect $100.",
    actionType: "RECEIVE_CASH",
    amount: 100,
  },
  {
    id: "cc-hospital-fee",
    deck: "community_chest",
    text: "Pay hospital fees of $100.",
    actionType: "PAY_CASH",
    amount: 100,
  },
  {
    id: "cc-school-fee",
    deck: "community_chest",
    text: "Pay school fees of $50.",
    actionType: "PAY_CASH",
    amount: 50,
  },
  {
    id: "cc-consultancy",
    deck: "community_chest",
    text: "Receive $25 consultancy fee.",
    actionType: "RECEIVE_CASH",
    amount: 25,
  },
  {
    id: "cc-street-repairs",
    deck: "community_chest",
    text: "You are assessed for street repairs. $40 per house, $115 per hotel.",
    actionType: "PAY_PER_BUILDING",
    houseCost: 40,
    hotelCost: 115,
  },
  {
    id: "cc-beauty-contest",
    deck: "community_chest",
    text: "You have won second prize in a beauty contest. Collect $10.",
    actionType: "RECEIVE_CASH",
    amount: 10,
  },
  {
    id: "cc-inherit",
    deck: "community_chest",
    text: "You inherit $100.",
    actionType: "RECEIVE_CASH",
    amount: 100,
  },
];

export function shuffleDeck<T>(deck: T[]): T[] {
  const copy = [...deck];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = temp;
  }
  return copy;
}
