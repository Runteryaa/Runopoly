import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { useGameStore } from "../../store/gameStore";
import { getTokenMeta } from "../../data/tokens";

export const GameOverBanner: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const resetGame = useGameStore((s) => s.resetGame);

  if (!gameState || gameState.status !== "ENDED" || !gameState.winnerId) return null;

  const winner = gameState.players[gameState.winnerId];
  if (!winner) return null;

  const meta = getTokenMeta(winner.token);

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.title}>VICTORY!</Text>
          <Text style={styles.winnerName}>{winner.nickname} WINS!</Text>
          <Text style={styles.winnerSub}>The ultimate tycoon of RunoPoly</Text>

          <View style={[styles.tokenBadge, { backgroundColor: meta.color }]}>
            <Text style={styles.tokenEmoji}>{meta.emoji}</Text>
          </View>

          <Text style={styles.statsText}>
            Final Net Worth: ${winner.cash}
          </Text>

          <TouchableOpacity style={styles.returnBtn} onPress={resetGame}>
            <Text style={styles.returnBtnText}>RETURN TO LOBBY</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#0f172a",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fbbf24",
  },
  trophy: {
    fontSize: 54,
    marginBottom: 8,
  },
  title: {
    color: "#fbbf24",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 3,
  },
  winnerName: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 4,
  },
  winnerSub: {
    color: "#94a3b8",
    fontSize: 13,
    marginBottom: 16,
  },
  tokenBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  tokenEmoji: {
    fontSize: 32,
  },
  statsText: {
    color: "#38bdf8",
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 12,
  },
  returnBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  returnBtnText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1,
  },
});
