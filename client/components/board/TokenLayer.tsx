import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Player } from "../../types";
import { getTokenMeta } from "../../data/tokens";
import { BOARD_SIZE, getTileBounds } from "./boardGeometry";

interface TokenLayerProps {
  players: Player[];
  boardSize: number;
}

interface TokenPieceProps {
  player: Player;
  x: number;
  y: number;
  size: number;
  scale: number;
}

function TokenPiece({ player, x, y, size, scale }: TokenPieceProps) {
  const previousIndex = useRef(player.position);

  const posX = useSharedValue(x);
  const posY = useSharedValue(y);
  const hop = useSharedValue(0);
  const appear = useSharedValue(0);

  useEffect(() => {
    appear.value = withSpring(1, { damping: 11, stiffness: 210 });
  }, [appear]);

  useEffect(() => {
    const from = previousIndex.current;
    const to = player.position;
    previousIndex.current = to;

    const steps = (to - from + 40) % 40;

    if (steps > 0 && steps <= 12) {
      const xs: any[] = [];
      const ys: any[] = [];
      const hops: any[] = [];

      for (let i = 1; i <= steps; i++) {
        const tile = getTileBounds((from + i) % 40);
        const isLast = i === steps;
        const duration = isLast ? 160 : 95;
        const stepX = isLast ? x : tile.centerX * scale;
        const stepY = isLast
          ? y
          : (tile.centerY + (tile.height > tile.width ? 12 : 2)) * scale;

        xs.push(
          withTiming(stepX, {
            duration,
            easing: Easing.inOut(Easing.quad),
          })
        );
        ys.push(
          withTiming(stepY, {
            duration,
            easing: Easing.inOut(Easing.quad),
          })
        );
        hops.push(
          withTiming(1, { duration: 45, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 45, easing: Easing.in(Easing.quad) })
        );
      }

      posX.value = withSequence(...xs);
      posY.value = withSequence(...ys);
      hop.value = withSequence(...hops);
    } else {
      // Teleports (jail / chance cards) and tiny fan-out adjustments.
      posX.value = withSpring(x, { damping: 16, stiffness: 180, mass: 0.6 });
      posY.value = withSpring(y, { damping: 16, stiffness: 180, mass: 0.6 });
    }
  }, [hop, player.position, posX, posY, scale, x, y]);

  const animatedStyle = useAnimatedStyle(() => ({
    left: posX.value - size / 2,
    top: posY.value - size / 2,
    opacity: appear.value,
    transform: [{ scale: appear.value * (1 + hop.value * 0.25) }],
  }));

  const meta = getTokenMeta(player.token);

  return (
    <Animated.View
      style={[
        styles.token,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: meta.color,
          borderWidth: Math.max(1.5, size * 0.07),
        },
        animatedStyle,
      ]}
    >
      <Text style={{ fontSize: size * 0.55 }}>{meta.emoji}</Text>
    </Animated.View>
  );
}

/**
 * Animated pawn overlay. Pawns hop tile-by-tile instead of teleporting,
 * and fan out when several players share a space.
 */
export function TokenLayer({ players, boardSize }: TokenLayerProps) {
  const scale = boardSize / BOARD_SIZE;

  const occupants = new Map<number, Player[]>();
  for (const player of players) {
    if (player.isBankrupt) continue;
    const list = occupants.get(player.position) ?? [];
    list.push(player);
    occupants.set(player.position, list);
  }

  const tokenSize = Math.max(16, 27 * scale);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {players.map((player) => {
        if (player.isBankrupt) return null;

        const tile = getTileBounds(player.position);
        const group = occupants.get(player.position) ?? [player];
        const memberIndex = group.findIndex((p) => p.id === player.id);

        const spread = Math.min(group.length, 4);
        let dx = 0;
        let dy = 0;

        if (spread === 2) {
          dx = (memberIndex === 0 ? -1 : 1) * tokenSize * 0.58;
        } else if (spread === 3) {
          dx = (memberIndex % 2 === 0 ? -1 : 1) * tokenSize * 0.55;
          dy = (memberIndex === 2 ? 1 : -1) * tokenSize * 0.45;
        } else if (spread >= 4) {
          dx = (memberIndex % 2 === 0 ? -1 : 1) * tokenSize * 0.55;
          dy = (memberIndex < 2 ? -1 : 1) * tokenSize * 0.45;
        }

        const x = tile.centerX * scale + dx;
        const y =
          (tile.centerY + (tile.height > tile.width ? 12 : 2)) * scale + dy;

        return (
          <TokenPiece
            key={player.id}
            player={player}
            x={x}
            y={y}
            size={tokenSize}
            scale={scale}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  token: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
});
