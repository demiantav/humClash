import { Pressable, PressableProps, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps extends PressableProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  style,
  children,
  onPressIn: onPressInProp,
  onPressOut: onPressOutProp,
  ...props
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: withSpring(scale.value === 0.95 ? 0.85 : 1, {
      stiffness: 400,
      damping: 20,
    }),
  }));

  const handlePressIn = (e: any) => {
    scale.value = withSpring(0.95, { stiffness: 400, damping: 20 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressInProp?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, { stiffness: 300, damping: 15 });
    onPressOutProp?.(e);
  };

  const sizeStyles = SIZE_MAP[size];
  const variantStyles = VARIANT_MAP[variant];

  return (
    <AnimatedPressable
      style={[
        styles.base,
        sizeStyles,
        variantStyles,
        animatedStyle,
        style as ViewStyle,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    minHeight: 48,
    minWidth: 48,
  },
});

const SIZE_MAP: Record<string, ViewStyle> = {
  sm: { paddingVertical: 10, paddingHorizontal: 20 },
  md: { paddingVertical: 18, paddingHorizontal: 32 },
  lg: { paddingVertical: 22, paddingHorizontal: 40 },
};

const VARIANT_MAP: Record<string, ViewStyle> = {
  primary: { backgroundColor: "#7C4DFF" },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#7C4DFF",
  },
  ghost: { backgroundColor: "transparent" },
};
