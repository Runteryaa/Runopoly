import { AuctionState, Player, PropertyState } from "../types/index.js";
import { getSpaceById } from "./board.js";

export function createAuction(
  spaceIndex: number,
  activePlayers: Player[]
): AuctionState {
  const nonBankruptIds = activePlayers
    .filter((p) => !p.isBankrupt && p.isConnected)
    .map((p) => p.id);

  return {
    spaceIndex,
    currentBid: 0,
    highestBidderId: null,
    activeBidderIds: nonBankruptIds,
    currentBidderIndex: 0,
    deadline: Date.now() + 30000, // 30s auction timeout
  };
}

export function placeBid(
  auction: AuctionState,
  playerId: string,
  bidAmount: number,
  playerCash: number
): { success: boolean; reason: string } {
  if (!auction.activeBidderIds.includes(playerId)) {
    return { success: false, reason: "You are not active in this auction." };
  }

  const minBid = auction.currentBid === 0 ? 10 : auction.currentBid + 10;
  if (bidAmount < minBid) {
    return { success: false, reason: `Bid must be at least $${minBid}.` };
  }

  if (bidAmount > playerCash) {
    return { success: false, reason: "You do not have enough cash." };
  }

  auction.currentBid = bidAmount;
  auction.highestBidderId = playerId;
  // Reset auction timer countdown (15s after each valid bid)
  auction.deadline = Date.now() + 15000;

  return { success: true, reason: "Bid accepted" };
}

export function foldAuction(
  auction: AuctionState,
  playerId: string
): { isAuctionOver: boolean; winnerId: string | null; winningBid: number } {
  auction.activeBidderIds = auction.activeBidderIds.filter((id) => id !== playerId);

  // If 1 bidder left and there's a bid
  if (auction.activeBidderIds.length <= 1) {
    return {
      isAuctionOver: true,
      winnerId: auction.highestBidderId,
      winningBid: auction.currentBid,
    };
  }

  return {
    isAuctionOver: false,
    winnerId: null,
    winningBid: auction.currentBid,
  };
}
