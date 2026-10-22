import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, SafeAreaView, ScrollView } from "react-native";
import { useGameStore } from "./store/gameStore.js";
import { LobbyScreen } from "./components/lobby/LobbyScreen.js";
import { WaitingRoom } from "./components/lobby/WaitingRoom.js";
import { BoardView } from "./components/board/BoardView.js";
import { PlayerListBar } from "./components/hud/PlayerListBar.js";
import { ActionBar } from "./components/hud/ActionBar.js";
import { DeedModal } from "./components/modals/DeedModal.js";
import { TradeModal } from "./components/modals/TradeModal.js";
import { AuctionModal } from "./components/modals/AuctionModal.js";
import { ChatModal } from "./components/chat/ChatModal.js";
import { GameOverBanner } from "./components/hud/GameOverBanner.js";

export default function App() {
  const gameState = useGameStore((s) => s.gameState);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Screen Routing */}
      {!gameState ? (
        <LobbyScreen />
      ) : gameState.status === "LOBBY" ? (
        <WaitingRoom />
      ) : (
        <View style={styles.gameContainer}>
          {/* Top Player HUD */}
          <PlayerListBar />

          {/* Main Board View */}
          <ScrollView
            contentContainerStyle={styles.boardScroll}
            showsVerticalScrollIndicator={false}
          >
            <BoardView />
          </ScrollView>

          {/* Bottom Interactive Action Dock */}
          <ActionBar />

          {/* Modals & Overlays */}
          <DeedModal />
          <TradeModal />
          <AuctionModal />
          <ChatModal />
          <GameOverBanner />
        </View>
      )}
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
