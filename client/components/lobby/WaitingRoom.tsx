import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useGameStore } from "../../store/gameStore.js";
import { getTokenMeta } from "../../data/tokens.js";
import { socketService } from "../../services/socketService.js";
import { Player } from "../../types/index.js";

export const WaitingRoom: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const myPlayerId = useGameStore((s) => s.playerId);
  const resetGame = useGameStore((s) => s.resetGame);

  if (!gameState || gameState.status !== "LOBBY") return null;

  const players: Player[] = Object.values(gameState.players);
  const isHost = gameState.hostId === myPlayerId;
  const myPlayer = myPlayerId ? gameState.players[myPlayerId] : null;
  const canStart = isHost && players.length >= 2;

  const handleToggleReady = () => {
    if (myPlayer) {
      socketService.setReady(!myPlayer.isReady);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>MATCH LOBBY</Text>
          <View style={styles.codeBadge}>
            <Text style={styles.codeLabel}>ROOM CODE:</Text>
            <Text style={styles.codeVal}>{gameState.roomCode}</Text>
          </View>
        </View>

        <Text style={styles.subtext}>
          Share this 4-letter room code with other players to join!
        </Text>

        {/* Player Roster */}
        <Text style={styles.rosterTitle}>PLAYERS IN LOBBY ({players.length}/8):</Text>
        <ScrollView style={styles.rosterList}>
          {players.map((p) => {
            const meta = getTokenMeta(p.token);
            const isMe = p.id === myPlayerId;
            const isRoomHost = p.id === gameState.hostId;

            return (
              <View key={p.id} style={styles.playerRow}>
                <View style={[styles.tokenCircle, { backgroundColor: meta.color }]}>
                  <Text style={styles.tokenEmoji}>{meta.emoji}</Text>
                </View>

                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>
                    {p.nickname} {isMe ? "(You)" : ""}
                  </Text>
                  <Text style={styles.playerRole}>{isRoomHost ? "👑 Room Host" : "Player"}</Text>
                </View>

                <View style={[styles.readyPill, p.isReady ? styles.pillReady : styles.pillWaiting]}>
                  <Text style={styles.readyText}>{p.isReady ? "READY" : "WAITING"}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Action Controls */}
        <View style={styles.actions}>
          {!isHost && (
            <TouchableOpacity
              style={[styles.btn, myPlayer?.isReady ? styles.btnNotReady : styles.btnReady]}
              onPress={handleToggleReady}
            >
              <Text style={styles.btnText}>
                {myPlayer?.isReady ? "SET NOT READY" : "I'M READY!"}
              </Text>
            </TouchableOpacity>
          )}

          {isHost && (
            <TouchableOpacity
              style={[styles.btn, canStart ? styles.btnStart : styles.btnDisabled]}
              disabled={!canStart}
              onPress={() => socketService.startGame()}
            >
              <Text style={styles.btnText}>
                {players.length < 2 ? "WAITING FOR 2+ PLAYERS..." : "🚀 START GAME"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.leaveBtn} onPress={resetGame}>
            <Text style={styles.leaveText}>LEAVE LOBBY</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090d16",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  codeBadge: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  codeLabel: {
    color: "#94a3b8",
    fontSize: 9,
    fontWeight: "bold",
  },
  codeVal: {
    color: "#fbbf24",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 4,
  },
  subtext: {
    color: "#64748b",
    fontSize: 12,
    marginVertical: 12,
  },
  rosterTitle: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
  },
  rosterList: {
    maxHeight: 280,
    marginVertical: 8,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  tokenCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  tokenEmoji: {
    fontSize: 18,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "bold",
  },
  playerRole: {
    color: "#94a3b8",
    fontSize: 11,
  },
  readyPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillReady: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderWidth: 1,
    borderColor: "#22c55e",
  },
  pillWaiting: {
    backgroundColor: "rgba(100, 116, 139, 0.2)",
  },
  readyText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  actions: {
    marginTop: 16,
    gap: 10,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  btnStart: {
    backgroundColor: "#16a34a",
  },
  btnReady: {
    backgroundColor: "#2563eb",
  },
  btnNotReady: {
    backgroundColor: "#dc2626",
  },
  btnDisabled: {
    backgroundColor: "#334155",
  },
  btnText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1,
  },
  leaveBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
  leaveText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "bold",
  },
});
