import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BoardView } from "../../components/board/BoardView";
import { ChatModal } from "../../components/chat/ChatModal";
import { ActionBar } from "../../components/hud/ActionBar";
import { GameOverBanner } from "../../components/hud/GameOverBanner";
import { PlayerListBar } from "../../components/hud/PlayerListBar";
import { AuctionModal } from "../../components/modals/AuctionModal";
import { DeedModal } from "../../components/modals/DeedModal";
import { TradeModal } from "../../components/modals/TradeModal";
import { useGameStore } from "../../store/gameStore";

export default function GameRoute() {
  const roomCode = useGameStore((s) => s.roomCode);
  const gameState = useGameStore((s) => s.gameState);

  if (!roomCode || !gameState) {
    return <Redirect href="/" />;
  }

  if (gameState.status === "LOBBY") {
    return <Redirect href="/lobby" />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.gameContainer}>
        <PlayerListBar />

        <ScrollView
          contentContainerStyle={styles.boardScroll}
          showsVerticalScrollIndicator={false}
        >
          <BoardView />
        </ScrollView>

        <ActionBar />

        <DeedModal />
        <TradeModal />
        <AuctionModal />
        <ChatModal />
        <GameOverBanner />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#090d16",
  },
  gameContainer: {
    flex: 1,
    backgroundColor: "#090d16",
    flexDirection: "column",
  },
  boardScroll: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 20,
  },
});
