import React, { useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";

interface PopInProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Where the card flies in from. */
  from?: "center" | "bottom";
  delay?: number;
}

/**
 * Lightweight mount animation used by modals and crafted cards.
 */
export function PopIn({ children, style, from = "center", delay = 0 }: PopInProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withSpring(1, { damping: 17, stiffness: 190, mass: 0.8 })
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    if (from === "bottom") {
      return {
        opacity: Math.min(1, p * 1.6),
        transform: [{ translateY: (1 - p) * 90 }],
      };
    }
    return {
      opacity: Math.min(1, p * 1.8),
      transform: [{ scale: 0.9 + p * 0.1 }],
    };
  });

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
