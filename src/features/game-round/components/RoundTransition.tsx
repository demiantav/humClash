import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";
import * as Haptics from "expo-haptics";

interface RoundTransitionProps {
  show: boolean;
  message: string;
  onFinish?: () => void;
}

export function RoundTransition({ show, message, onFinish }: RoundTransitionProps) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (show) {
      scale.value = 0.8;
      opacity.value = 0;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      scale.value = withSequence(
        withTiming(1.1, { duration: 300, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 200 }),
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(1, { duration: 800 }),
        withTiming(0, { duration: 300 }),
      );

      setTimeout(() => onFinish?.(), 1300);
    }
  }, [show]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!show) return null;

  return (
    <Animated.View style={[styles.overlay, animatedStyle]}>
      <Animated.Text style={styles.text}>{message}</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    backgroundColor: "rgba(15, 10, 26, 0.95)",
  },
  text: {
    color: "#FFD700",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    textShadowColor: "rgba(255, 215, 0, 0.5)",
    textShadowRadius: 20,
  },
});
