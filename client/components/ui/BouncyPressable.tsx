import React from "react";
import { Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface BouncyPressableProps extends Omit<PressableProps, "style" | "children"> {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /** How much the control shrinks while pressed (0.9 = 90%). */
  pressedScale?: number;
}

/**
 * Pressable with a springy squish on press. Works on native and web.
 */
export function BouncyPressable({
  style,
  children,
  pressedScale = 0.94,
  onPressIn,
  onPressOut,
  ...props
}: BouncyPressableProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(pressed.value ? pressedScale : 1, {
          damping: 14,
          stiffness: 320,
          mass: 0.5,
        }),
      },
    ],
  }));

  return (
    <AnimatedPressable
      {...props}
      style={[style, animatedStyle]}
      onPressIn={(event) => {
        pressed.value = 1;
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressed.value = 0;
        onPressOut?.(event);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
