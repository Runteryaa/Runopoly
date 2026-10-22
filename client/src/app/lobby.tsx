import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { WaitingRoom } from "../../components/lobby/WaitingRoom";
import { ScreenFade } from "../../components/ui/ScreenFade";
import { useGameStore } from "../../store/gameStore";

export default function LobbyRoute() {
  const roomCode = useGameStore((s) => s.roomCode);
  const gameState = useGameStore((s) => s.gameState);

  if (!roomCode) {
    return <Redirect href="/" />;
  }

  if (gameState && gameState.status !== "LOBBY") {
    return <Redirect href="/game" />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenFade>
        {gameState ? (
          <WaitingRoom />
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#38bdf8" />
            <Text style={styles.loadingText}>Joining room {roomCode}...</Text>
          </View>
        )}
      </ScreenFade>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#090d16",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: 13,
  },
});
