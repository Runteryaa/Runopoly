import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput } from "react-native";
import { useGameStore } from "../../store/gameStore.js";
import { getSpace, COLOR_GROUP_COLORS } from "../../data/boardData.js";
import { socketService } from "../../services/socketService.js";

export const AuctionModal: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const myPlayerId = useGameStore((s) => s.playerId);
  const [customBid, setCustomBid] = useState("");

  const auction = gameState?.currentAuction;
  if (!auction || gameState?.status !== "PLAYING") return null;

  const space = getSpace(auction.spaceIndex);
  const color = COLOR_GROUP_COLORS[space.group];
  const highestBidder = auction.highestBidderId
    ? gameState?.players[auction.highestBidderId]
    : null;

  const myPlayer = myPlayerId ? gameState?.players[myPlayerId] : null;
  const isActiveBidder = myPlayerId ? auction.activeBidderIds.includes(myPlayerId) : false;
  const isHighestBidder = auction.highestBidderId === myPlayerId;

  const handleQuickBid = (increment: number) => {
    const nextBid = Math.max(auction.currentBid + increment, 10);
    socketService.auctionBid(nextBid);
  };

  const handleCustomBid = () => {
    const val = parseInt(customBid, 10);
    if (!isNaN(val) && val > auction.currentBid) {
      socketService.auctionBid(val);
      setCustomBid("");
    }
  };

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: color }]}>
            <Text style={styles.subTitle}>PUBLIC AUCTION</Text>
            <Text style={styles.propertyName}>{space.name}</Text>
          </View>

          <View style={styles.body}>
            {/* Bid info */}
            <View style={styles.bidCard}>
              <Text style={styles.bidLabel}>CURRENT HIGHEST BID</Text>
              <Text style={styles.bidAmount}>
                {auction.currentBid > 0 ? `$${auction.currentBid}` : "No Bids Yet ($10 Min)"}
              </Text>
              <Text style={styles.bidderName}>
                {highestBidder
                  ? `Leader: ${highestBidder.nickname}${isHighestBidder ? " (You!)" : ""}`
                  : "Bidding is open to all active players"}
              </Text>
            </View>

            {/* Bidder action controls */}
            {isActiveBidder ? (
              <View style={styles.bidActions}>
                <Text style={styles.myCash}>Your Cash: ${myPlayer?.cash || 0}</Text>

                <View style={styles.quickRow}>
                  <TouchableOpacity
                    style={styles.quickBtn}
                    onPress={() => handleQuickBid(10)}
                  >
                    <Text style={styles.quickText}>+$10</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickBtn}
                    onPress={() => handleQuickBid(50)}
                  >
                    <Text style={styles.quickText}>+$50</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickBtn}
                    onPress={() => handleQuickBid(100)}
                  >
                    <Text style={styles.quickText}>+$100</Text>
                  </TouchableOpacity>
                </View>

                {/* Custom Bid Row */}
                <View style={styles.customRow}>
                  <TextInput
                    style={styles.input}
                    placeholder={`>${auction.currentBid}`}
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={customBid}
                    onChangeText={setCustomBid}
                  />
                  <TouchableOpacity style={styles.customBtn} onPress={handleCustomBid}>
                    <Text style={styles.customBtnText}>BID</Text>
                  </TouchableOpacity>
                </View>

                {/* Fold button */}
                <TouchableOpacity
                  style={styles.foldBtn}
                  onPress={() => socketService.auctionFold()}
                >
                  <Text style={styles.foldText}>FOLD / PASS</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.foldedNotice}>
                <Text style={styles.foldedText}>
                  You have folded or are not participating in this auction.
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#0f172a",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#eab308",
  },
  header: {
    paddingVertical: 14,
    alignItems: "center",
  },
  subTitle: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
  },
  propertyName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 2,
  },
  body: {
    padding: 16,
  },
  bidCard: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 14,
  },
  bidLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  bidAmount: {
    color: "#eab308",
    fontSize: 28,
    fontWeight: "900",
    marginVertical: 4,
  },
  bidderName: {
    color: "#cbd5e1",
    fontSize: 13,
  },
  bidActions: {
    gap: 10,
  },
  myCash: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  quickRow: {
    flexDirection: "row",
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  quickText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 13,
  },
  customRow: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#475569",
    borderRadius: 8,
    paddingHorizontal: 12,
    color: "#ffffff",
    fontSize: 14,
  },
  customBtn: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  customBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  foldBtn: {
    backgroundColor: "#334155",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  foldText: {
    color: "#ef4444",
    fontWeight: "bold",
    fontSize: 13,
  },
  foldedNotice: {
    paddingVertical: 20,
    alignItems: "center",
  },
  foldedText: {
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
  },
});
