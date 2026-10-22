import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { useGameStore } from "../../store/gameStore.js";
import { getSpace } from "../../data/boardData.js";
import { socketService } from "../../services/socketService.js";
import { Player } from "../../types/index.js";

export const TradeModal: React.FC = () => {
  const activeModal = useGameStore((s) => s.activeModal);
  const setActiveModal = useGameStore((s) => s.setActiveModal);
  const gameState = useGameStore((s) => s.gameState);
  const myPlayerId = useGameStore((s) => s.playerId);

  const [targetPlayerId, setTargetPlayerId] = useState<string | null>(null);
  const [offeredCash, setOfferedCash] = useState("");
  const [requestedCash, setRequestedCash] = useState("");
  const [selectedOfferProps, setSelectedOfferProps] = useState<number[]>([]);
  const [selectedReqProps, setSelectedReqProps] = useState<number[]>([]);

  if (activeModal !== "trade" || !gameState) return null;

  const players: Player[] = Object.values(gameState.players).filter(
    (p) => p.id !== myPlayerId && !p.isBankrupt
  );
  const myPlayer = myPlayerId ? gameState.players[myPlayerId] : null;

  // Selected target opponent or default to first
  const currentTargetId = targetPlayerId || (players[0]?.id ?? null);
  const targetPlayer = currentTargetId ? gameState.players[currentTargetId] : null;

  // Get my owned properties
  const myProperties: number[] = [];
  const targetProperties: number[] = [];

  for (const [idStr, prop] of Object.entries(gameState.properties)) {
    const id = parseInt(idStr, 10);
    if (prop.ownerId === myPlayerId) {
      myProperties.push(id);
    } else if (prop.ownerId === currentTargetId) {
      targetProperties.push(id);
    }
  }

  // Check if there is an incoming pending trade for me
  const incomingTrade =
    gameState.pendingTrade &&
    gameState.pendingTrade.toPlayerId === myPlayerId &&
    gameState.pendingTrade.status === "pending"
      ? gameState.pendingTrade
      : null;

  const handleSendProposal = () => {
    if (!myPlayerId || !currentTargetId) return;

    socketService.proposeTrade({
      fromPlayerId: myPlayerId,
      toPlayerId: currentTargetId,
      offeredCash: parseInt(offeredCash, 10) || 0,
      offeredProperties: selectedOfferProps,
      offeredJailCards: 0,
      requestedCash: parseInt(requestedCash, 10) || 0,
      requestedProperties: selectedReqProps,
      requestedJailCards: 0,
    });

    setActiveModal(null);
  };

  const toggleOfferProp = (id: number) => {
    setSelectedOfferProps((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleReqProp = (id: number) => {
    setSelectedReqProps((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>TRADE PROPOSAL</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Incoming Trade Banner */}
          {incomingTrade && (
            <View style={styles.incomingBanner}>
              <Text style={styles.incomingTitle}>
                🔔 Incoming Trade from {gameState.players[incomingTrade.fromPlayerId]?.nickname}!
              </Text>
              <Text style={styles.incomingDetail}>
                Offered: ${incomingTrade.offeredCash} + {incomingTrade.offeredProperties.length} properties
              </Text>
              <Text style={styles.incomingDetail}>
                Demanded: ${incomingTrade.requestedCash} + {incomingTrade.requestedProperties.length} properties
              </Text>
              <View style={styles.incomingButtons}>
                <TouchableOpacity
                  style={[styles.smallBtn, styles.btnGreen]}
                  onPress={() => socketService.respondTrade(incomingTrade.id, true)}
                >
                  <Text style={styles.btnText}>ACCEPT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallBtn, styles.btnRed]}
                  onPress={() => socketService.respondTrade(incomingTrade.id, false)}
                >
                  <Text style={styles.btnText}>DECLINE</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <ScrollView style={styles.body}>
            {/* Target Opponent Selector */}
            <Text style={styles.sectionLabel}>Select Opponent:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerPicker}>
              {players.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.pickerTab, currentTargetId === p.id && styles.pickerTabActive]}
                  onPress={() => {
                    setTargetPlayerId(p.id);
                    setSelectedReqProps([]);
                  }}
                >
                  <Text style={[styles.pickerText, currentTargetId === p.id && styles.pickerTextActive]}>
                    {p.nickname} (${p.cash})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.tradeColumns}>
              {/* Left Column: What You Offer */}
              <View style={styles.column}>
                <Text style={styles.colTitle}>YOU OFFER</Text>
                <TextInput
                  style={styles.cashInput}
                  placeholder={`Cash (Max $${myPlayer?.cash || 0})`}
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={offeredCash}
                  onChangeText={setOfferedCash}
                />
                <Text style={styles.propSubhead}>Your Properties ({myProperties.length}):</Text>
                <View style={styles.propList}>
                  {myProperties.map((id) => {
                    const space = getSpace(id);
                    const isSelected = selectedOfferProps.includes(id);
                    return (
                      <TouchableOpacity
                        key={`my-prop-${id}`}
                        style={[styles.propItem, isSelected && styles.propItemOffer]}
                        onPress={() => toggleOfferProp(id)}
                      >
                        <Text style={styles.propName} numberOfLines={1}>
                          {space.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Right Column: What You Request */}
              <View style={styles.column}>
                <Text style={styles.colTitle}>YOU REQUEST</Text>
                <TextInput
                  style={styles.cashInput}
                  placeholder={`Cash (Max $${targetPlayer?.cash || 0})`}
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={requestedCash}
                  onChangeText={setRequestedCash}
                />
                <Text style={styles.propSubhead}>Their Properties ({targetProperties.length}):</Text>
                <View style={styles.propList}>
                  {targetProperties.map((id) => {
                    const space = getSpace(id);
                    const isSelected = selectedReqProps.includes(id);
                    return (
                      <TouchableOpacity
                        key={`target-prop-${id}`}
                        style={[styles.propItem, isSelected && styles.propItemReq]}
                        onPress={() => toggleReqProp(id)}
                      >
                        <Text style={styles.propName} numberOfLines={1}>
                          {space.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Propose Button */}
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendProposal}>
              <Text style={styles.sendBtnText}>PROPOSE TRADE OFFER</Text>
            </TouchableOpacity>
          </ScrollView>
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
    padding: 14,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#0f172a",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#334155",
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#1e293b",
  },
  headerTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  closeIcon: {
    color: "#94a3b8",
    fontSize: 16,
    fontWeight: "bold",
  },
  body: {
    padding: 14,
  },
  incomingBanner: {
    backgroundColor: "#1e3a8a",
    padding: 12,
    borderRadius: 10,
    margin: 14,
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  incomingTitle: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 13,
  },
  incomingDetail: {
    color: "#cbd5e1",
    fontSize: 12,
    marginTop: 2,
  },
  incomingButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  smallBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  btnGreen: {
    backgroundColor: "#16a34a",
  },
  btnRed: {
    backgroundColor: "#dc2626",
  },
  btnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 12,
  },
  sectionLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 6,
  },
  playerPicker: {
    flexDirection: "row",
    marginBottom: 12,
  },
  pickerTab: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  pickerTabActive: {
    borderColor: "#3b82f6",
    backgroundColor: "#1e3a8a",
  },
  pickerText: {
    color: "#cbd5e1",
    fontSize: 12,
  },
  pickerTextActive: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  tradeColumns: {
    flexDirection: "row",
    gap: 10,
  },
  column: {
    flex: 1,
    backgroundColor: "#1e293b",
    padding: 10,
    borderRadius: 10,
  },
  colTitle: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 6,
  },
  cashInput: {
    backgroundColor: "#0f172a",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#334155",
    color: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    marginBottom: 8,
  },
  propSubhead: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
  },
  propList: {
    gap: 4,
    maxHeight: 180,
  },
  propItem: {
    backgroundColor: "#0f172a",
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  propItemOffer: {
    borderColor: "#22c55e",
    backgroundColor: "rgba(34, 197, 94, 0.2)",
  },
  propItemReq: {
    borderColor: "#3b82f6",
    backgroundColor: "rgba(59, 130, 246, 0.2)",
  },
  propName: {
    color: "#f8fafc",
    fontSize: 11,
  },
  sendBtn: {
    backgroundColor: "#2563eb",
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  sendBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 13,
  },
});
