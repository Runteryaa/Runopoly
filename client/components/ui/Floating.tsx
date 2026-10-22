import React, { useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface FloatingProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  distance?: number;
  duration?: number;
}

/**
 * Gentle idle float, handy for brand emblems and mascots.
 */
export function Floating({ children, style, distance = 5, duration = 1800 }: FloatingProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -progress.value * distance }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
