import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface DiceOverlayProps {
  dice: [number, number] | null;
  triggerKey: string | null;
  boardSize: number;
}

const PIP_LAYOUT: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function Die({ value, size }: { value: number; size: number }) {
  const pips = PIP_LAYOUT[value] ?? PIP_LAYOUT[1]!;
  const pipSize = size * 0.14;

  return (
    <View
      style={[
        styles.die,
        {
          width: size,
          height: size,
          borderRadius: size * 0.2,
          borderWidth: Math.max(1, size * 0.03),
        },
      ]}
    >
      {pips.map((slot) => {
        const row = Math.floor(slot / 3);
        const col = slot % 3;
        return (
          <View
            key={slot}
            style={{
              position: "absolute",
              width: pipSize,
              height: pipSize,
              borderRadius: pipSize / 2,
              left: size * 0.19 + col * size * 0.29,
              top: size * 0.19 + row * size * 0.29,
              backgroundColor: value === 1 ? "#ef4444" : "#0f172a",
            }}
          />
        );
      })}
    </View>
  );
}

/**
 * Two dice that tumble in over the board whenever a new roll arrives.
 * The board's static dice remain visible after this overlay fades away.
 */
export function DiceOverlay({ dice, triggerKey, boardSize }: DiceOverlayProps) {
  const lastTrigger = useRef<string | null>(null);

  const opacity = useSharedValue(0);
  const spinA = useSharedValue(0);
  const spinB = useSharedValue(0);
  const dropA = useSharedValue(-1.4);
  const dropB = useSharedValue(-1.4);
  const scaleA = useSharedValue(0.5);
  const scaleB = useSharedValue(0.5);

  useEffect(() => {
    if (!dice) {
      lastTrigger.current = null;
      opacity.value = withTiming(0, { duration: 150 });
      return;
    }
    if (!triggerKey || lastTrigger.current === triggerKey) return;
    lastTrigger.current = triggerKey;

    opacity.value = 0;
    spinA.value = 0;
    spinB.value = 0;
    dropA.value = -1.4;
    dropB.value = -1.4;
    scaleA.value = 0.5;
    scaleB.value = 0.5;

    opacity.value = withSequence(
      withTiming(1, { duration: 120 }),
      withDelay(1700, withTiming(0, { duration: 320 }))
    );
    dropA.value = withSpring(0, { damping: 11, stiffness: 230, mass: 0.7 });
    dropB.value = withDelay(
      90,
      withSpring(0, { damping: 12, stiffness: 220, mass: 0.7 })
    );
    scaleA.value = withSpring(1, { damping: 10, stiffness: 260 });
    scaleB.value = withDelay(90, withSpring(1, { damping: 10, stiffness: 260 }));
    spinA.value = withTiming(1, {
      duration: 760,
      easing: Easing.out(Easing.cubic),
    });
    spinB.value = withTiming(1, {
      duration: 820,
      easing: Easing.out(Easing.cubic),
    });
  }, [dice, dropA, dropB, opacity, scaleA, scaleB, spinA, spinB, triggerKey]);

  const firstDieStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: dropA.value * 110 },
      { rotate: `${spinA.value * 720 - 24}deg` },
      { scale: scaleA.value },
    ],
  }));

  const secondDieStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: dropB.value * 110 },
      { rotate: `${spinB.value * -720 + 18}deg` },
      { scale: scaleB.value },
    ],
  }));

  if (!dice) return null;

  const size = Math.max(46, Math.min(74, boardSize * 0.105));

  return (
    <View
      pointerEvents="none"
      style={[
        styles.layer,
        {
          top: boardSize * 0.62 - size / 2,
          height: size,
        },
      ]}
    >
      <Animated.View style={[{ marginRight: size * 0.14 }, firstDieStyle]}>
        <Die value={dice[0]} size={size} />
      </Animated.View>
      <Animated.View style={secondDieStyle}>
        <Die value={dice[1]} size={size} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  die: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
});
