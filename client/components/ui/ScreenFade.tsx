import React, { useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface ScreenFadeProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Soft fade-and-rise when a route mounts.
 */
export function ScreenFade({ children, style }: ScreenFadeProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 360,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 10 }],
  }));

  return (
    <Animated.View style={[style, animatedStyle, { flex: 1 }]}>
      {children}
    </Animated.View>
  );
}
