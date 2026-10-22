import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { BOARD_SPACES } from "../../data/boardData";
import { useGameStore } from "../../store/gameStore";
import { BOARD_SIZE, getTileBounds } from "./boardGeometry";

interface BoardTilePressLayerProps {
  boardSize: number;
}

/**
 * Invisible tap targets laid over the SVG tiles.
 *
 * react-native-svg's web renderer turns `onPress` into responder props that
 * React DOM does not understand, which floods the console with errors. Keeping
 * interaction in plain RN Pressables is reliable on native and web.
 */
export function BoardTilePressLayer({ boardSize }: BoardTilePressLayerProps) {
  const setActiveModal = useGameStore((s) => s.setActiveModal);
  const hapticsEnabled = useGameStore((s) => s.hapticsEnabled);
  const scale = boardSize / BOARD_SIZE;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {BOARD_SPACES.map((space) => {
        const bounds = getTileBounds(space.id);

        return (
          <Pressable
            key={`tile-press-${space.id}`}
            accessibilityRole="button"
            accessibilityLabel={space.name}
            onPress={() => {
              if (hapticsEnabled) {
                Haptics.selectionAsync().catch(() => undefined);
              }
              setActiveModal("deed", space.id);
            }}
            style={({ pressed }) => [
              styles.tile,
              {
                left: bounds.x * scale,
                top: bounds.y * scale,
                width: bounds.width * scale,
                height: bounds.height * scale,
              },
              pressed && styles.pressed,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    position: "absolute",
    borderRadius: 4,
  },
  pressed: {
    backgroundColor: "rgba(56, 189, 248, 0.18)",
    borderColor: "rgba(56, 189, 248, 0.45)",
    borderWidth: 1,
  },
});
