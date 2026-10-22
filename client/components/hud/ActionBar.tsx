import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useGameStore } from "../../store/gameStore.js";
import { socketService } from "../../services/socketService.js";
import { getSpace } from "../../data/boardData.js";

export const ActionBar: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const myPlayerId = useGameStore((s) => s.playerId);
  const unreadChat = useGameStore((s) => s.unreadChatCount);
  const setActiveModal = useGameStore((s) => s.setActiveModal);
  const isMuted = useGameStore((s) => s.isMuted);
  const toggleMute = useGameStore((s) => s.toggleMute);

  if (!gameState || gameState.status !== "PLAYING") return null;

  const myPlayer = myPlayerId ? gameState.players[myPlayerId] : null;
  const activePlayer = gameState.playerOrder[gameState.activePlayerIndex]
    ? gameState.players[gameState.playerOrder[gameState.activePlayerIndex]!]
    : null;

  const isMyTurn = activePlayer?.id === myPlayerId && !myPlayer?.isBankrupt;
  const currentSpace = myPlayer ? getSpace(myPlayer.position) : null;

  return (
    <View style={styles.container}>
      {/* Turn Header Status */}
      <View style={styles.statusHeader}>
        <Text style={styles.statusText}>
          {isMyTurn ? (
            <Text style={styles.yourTurn}>⭐ YOUR TURN</Text>
          ) : (
            <Text style={styles.otherTurn}>
              ⏳ {activePlayer?.nickname}'s Turn ({gameState.turnPhase.replace("_", " ")})
            </Text>
          )}
        </Text>
        {gameState.turnTimerEnd && (
          <Text style={styles.timerText}>
            ⏱️ {Math.max(0, Math.ceil((gameState.turnTimerEnd - Date.now()) / 1000))}s
          </Text>
        )}
      </View>

      {/* Main Action Buttons */}
      <View style={styles.buttonsRow}>
        {/* Roll Dice Button */}
        {isMyTurn && gameState.turnPhase === "START_TURN" && (
          <TouchableOpacity
            style={[styles.btn, styles.btnRoll]}
            onPress={() => socketService.rollDice()}
          >
            <Text style={styles.btnText}>🎲 ROLL DICE</Text>
          </TouchableOpacity>
        )}

        {/* Buy Property Decision */}
        {isMyTurn && gameState.turnPhase === "BUY_DECISION" && currentSpace && (
          <>
            <TouchableOpacity
              style={[styles.btn, styles.btnBuy]}
              onPress={() => socketService.buyProperty()}
            >
              <Text style={styles.btnText}>💳 BUY (${currentSpace.cost})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnDecline]}
              onPress={() => socketService.declineProperty()}
            >
              <Text style={styles.btnText}>🔨 AUCTION</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Jail Decisions */}
        {isMyTurn && myPlayer?.inJail && gameState.turnPhase === "START_TURN" && (
          <>
            {myPlayer.cash >= 50 && (
              <TouchableOpacity
                style={[styles.btn, styles.btnJail]}
                onPress={() => socketService.payJailFine()}
              >
                <Text style={styles.btnText}>💵 PAY $50</Text>
              </TouchableOpacity>
            )}

            {myPlayer.getOutOfJailCards > 0 && (
              <TouchableOpacity
                style={[styles.btn, styles.btnJailCard]}
                onPress={() => socketService.useJailCard()}
              >
                <Text style={styles.btnText}>🃏 USE CARD</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* End Turn */}
        {isMyTurn && gameState.turnPhase === "END_TURN" && (
          <TouchableOpacity
            style={[styles.btn, styles.btnEndTurn]}
            onPress={() => socketService.endTurn()}
          >
            <Text style={styles.btnText}>⏭️ END TURN</Text>
          </TouchableOpacity>
        )}

        {/* Universal Utility Buttons */}
        <TouchableOpacity
          style={[styles.btn, styles.btnUtility]}
          onPress={() => setActiveModal("trade")}
        >
          <Text style={styles.btnText}>🤝 TRADE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnUtility, unreadChat > 0 && styles.btnChatUnread]}
          onPress={() => setActiveModal("chat")}
        >
          <Text style={styles.btnText}>
            💬 {unreadChat > 0 ? `(${unreadChat})` : "CHAT"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnMute]}
          onPress={toggleMute}
        >
          <Text style={styles.btnText}>{isMuted ? "🔇" : "🔊"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0f172a",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "bold",
  },
  yourTurn: {
    color: "#22c55e",
  },
  otherTurn: {
    color: "#94a3b8",
  },
  timerText: {
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: "bold",
  },
  buttonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 13,
  },
  btnRoll: {
    backgroundColor: "#2563eb",
    flexGrow: 1,
  },
  btnBuy: {
    backgroundColor: "#16a34a",
    flexGrow: 1,
  },
  btnDecline: {
    backgroundColor: "#dc2626",
    flexGrow: 1,
  },
  btnEndTurn: {
    backgroundColor: "#f59e0b",
    flexGrow: 1,
  },
  btnJail: {
    backgroundColor: "#7c3aed",
  },
  btnJailCard: {
    backgroundColor: "#059669",
  },
  btnUtility: {
    backgroundColor: "#334155",
  },
  btnChatUnread: {
    backgroundColor: "#3b82f6",
  },
  btnMute: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 10,
  },
});
