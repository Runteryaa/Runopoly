import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, SafeAreaView, ScrollView } from "react-native";
import { useGameStore } from "./store/gameStore";
import { LobbyScreen } from "./components/lobby/LobbyScreen";
import { WaitingRoom } from "./components/lobby/WaitingRoom";
import { BoardView } from "./components/board/BoardView";
import { PlayerListBar } from "./components/hud/PlayerListBar";
import { ActionBar } from "./components/hud/ActionBar";
import { DeedModal } from "./components/modals/DeedModal";
import { TradeModal } from "./components/modals/TradeModal";
import { AuctionModal } from "./components/modals/AuctionModal";
import { ChatModal } from "./components/chat/ChatModal";
import { GameOverBanner } from "./components/hud/GameOverBanner";

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
