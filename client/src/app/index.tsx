import React from "react";
import { StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LobbyScreen } from "../../components/lobby/LobbyScreen";
import { ScreenFade } from "../../components/ui/ScreenFade";
import { useGameStore } from "../../store/gameStore";

export default function WelcomeRoute() {
  const gameState = useGameStore((s) => s.gameState);

  if (gameState?.status === "LOBBY") {
    return <Redirect href="/lobby" />;
  }

  if (gameState?.status === "PLAYING" || gameState?.status === "ENDED") {
    return <Redirect href="/game" />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScreenFade>
        <LobbyScreen />
      </ScreenFade>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#090d16",
  },
});
