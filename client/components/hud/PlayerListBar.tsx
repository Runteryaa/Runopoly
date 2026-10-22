import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useGameStore } from "../../store/gameStore.js";
import { getTokenMeta } from "../../data/tokens.js";
import { Player } from "../../types/index.js";

export const PlayerListBar: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const myPlayerId = useGameStore((s) => s.playerId);
  const setActiveModal = useGameStore((s) => s.setActiveModal);

  if (!gameState) return null;

  const players: Player[] = Object.values(gameState.players);
  const activePlayer = gameState.playerOrder[gameState.activePlayerIndex]
    ? gameState.players[gameState.playerOrder[gameState.activePlayerIndex]!]
    : null;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {players.map((p) => {
          const meta = getTokenMeta(p.token);
          const isActive = activePlayer?.id === p.id;
          const isMe = p.id === myPlayerId;

          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.playerCard,
                isActive && styles.activeCard,
                p.isBankrupt && styles.bankruptCard,
              ]}
              onPress={() => {
                if (!isMe && !p.isBankrupt && gameState.status === "PLAYING") {
                  setActiveModal("trade");
                }
              }}
            >
              <View style={[styles.avatar, { backgroundColor: meta.color }]}>
                <Text style={styles.avatarEmoji}>{meta.emoji}</Text>
              </View>

              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {p.nickname} {isMe ? "(You)" : ""}
                  </Text>
                  {p.inJail && <Text style={styles.jailBadge}>🔒</Text>}
                  {!p.isConnected && <Text style={styles.offlineDot}>●</Text>}
                </View>

                {p.isBankrupt ? (
                  <Text style={styles.bankruptText}>BANKRUPT</Text>
                ) : (
                  <Text style={styles.cash}>${p.cash}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0f172a",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  scroll: {
    paddingHorizontal: 12,
    gap: 10,
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#334155",
    minWidth: 130,
  },
  activeCard: {
    borderColor: "#fbbf24",
    backgroundColor: "#1e293b",
  },
  bankruptCard: {
    opacity: 0.5,
    borderColor: "#ef4444",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  name: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "bold",
  },
  cash: {
    color: "#38bdf8",
    fontSize: 13,
    fontWeight: "800",
  },
  jailBadge: {
    fontSize: 10,
  },
  offlineDot: {
    color: "#ef4444",
    fontSize: 10,
  },
  bankruptText: {
    color: "#ef4444",
    fontSize: 11,
    fontWeight: "bold",
  },
});
