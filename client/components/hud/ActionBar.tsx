import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useGameStore } from "../../store/gameStore";
import { socketService } from "../../services/socketService";
import { getSpace } from "../../data/boardData";
import { BouncyPressable } from "../ui/BouncyPressable";

function YourTurnPulse() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 850, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.7 + pulse.value * 0.3,
    transform: [{ scale: 1 + pulse.value * 0.035 }],
  }));

  return (
    <Animated.Text style={[styles.yourTurn, animatedStyle]}>
      ⭐ YOUR TURN
    </Animated.Text>
  );
}

function TurnTimer({ end }: { end: number }) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const update = () => {
      setSecondsLeft(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [end]);

  return <Text style={styles.timerText}>⏱️ {secondsLeft}s</Text>;
}

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
        {isMyTurn ? (
          <YourTurnPulse />
        ) : (
          <Text style={styles.otherTurn}>
            {`⏳ ${activePlayer?.nickname ?? "Player"}'s Turn (${gameState.turnPhase.replace("_", " ")})`}
          </Text>
        )}
        {gameState.turnTimerEnd && <TurnTimer end={gameState.turnTimerEnd} />}
      </View>

      {/* Main Action Buttons */}
      <View style={styles.buttonsRow}>
        {isMyTurn && gameState.turnPhase === "START_TURN" && (
          <BouncyPressable
            style={[styles.btn, styles.btnRoll]}
            onPress={() => socketService.rollDice()}
          >
            <Text style={styles.btnText}>🎲 ROLL DICE</Text>
          </BouncyPressable>
        )}

        {isMyTurn && gameState.turnPhase === "BUY_DECISION" && currentSpace && (
          <>
            <BouncyPressable
              style={[styles.btn, styles.btnBuy]}
              onPress={() => socketService.buyProperty()}
            >
              <Text style={styles.btnText}>💳 BUY (${currentSpace.cost})</Text>
            </BouncyPressable>

            <BouncyPressable
              style={[styles.btn, styles.btnDecline]}
              onPress={() => socketService.declineProperty()}
            >
              <Text style={styles.btnText}>🔨 AUCTION</Text>
            </BouncyPressable>
          </>
        )}

        {isMyTurn && myPlayer?.inJail && gameState.turnPhase === "START_TURN" && (
          <>
            {myPlayer.cash >= 50 && (
              <BouncyPressable
                style={[styles.btn, styles.btnJail]}
                onPress={() => socketService.payJailFine()}
              >
                <Text style={styles.btnText}>💵 PAY $50</Text>
              </BouncyPressable>
            )}

            {myPlayer.getOutOfJailCards > 0 && (
              <BouncyPressable
                style={[styles.btn, styles.btnJailCard]}
                onPress={() => socketService.useJailCard()}
              >
                <Text style={styles.btnText}>🃏 USE CARD</Text>
              </BouncyPressable>
            )}
          </>
        )}

        {isMyTurn && gameState.turnPhase === "END_TURN" && (
          <BouncyPressable
            style={[styles.btn, styles.btnEndTurn]}
            onPress={() => socketService.endTurn()}
          >
            <Text style={styles.btnText}>⏭️ END TURN</Text>
          </BouncyPressable>
        )}

        <BouncyPressable
          style={[styles.btn, styles.btnUtility]}
          onPress={() => setActiveModal("trade")}
        >
          <Text style={styles.btnText}>🤝 TRADE</Text>
        </BouncyPressable>

        <BouncyPressable
          style={[styles.btn, styles.btnUtility, unreadChat > 0 && styles.btnChatUnread]}
          onPress={() => setActiveModal("chat")}
        >
          <Text style={styles.btnText}>
            💬 {unreadChat > 0 ? `(${unreadChat})` : "CHAT"}
          </Text>
        </BouncyPressable>

        <BouncyPressable
          style={[styles.btn, styles.btnMute]}
          onPress={toggleMute}
        >
          <Text style={styles.btnText}>{isMuted ? "🔇" : "🔊"}</Text>
        </BouncyPressable>
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
