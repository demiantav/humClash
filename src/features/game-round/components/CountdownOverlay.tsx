import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { useEffect, useState } from "react";
import * as Haptics from "expo-haptics";

interface CountdownOverlayProps {
  onFinish: () => void;
}

export function CountdownOverlay({ onFinish }: CountdownOverlayProps) {
  const [count, setCount] = useState(3);
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const tick = (n: number) => {
      if (n < 0) {
        onFinish();
        return;
      }
      setCount(n);
      scale.value = 0.3;
      scale.value = withSpring(1, { stiffness: 300, damping: 10 });
      opacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0.6, { duration: 600 }),
      );

      if (n === 3 || n === 2) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (n === 1) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    };

    tick(3);
    const t1 = setTimeout(() => tick(2), 800);
    const t2 = setTimeout(() => tick(1), 1600);
    const t3 = setTimeout(() => tick(0), 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.overlay}>
      <Text style={styles.label}>¡Preparate!</Text>
      <Animated.Text style={[styles.number, numberStyle]}>
        {count > 0 ? count : "YA"}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(15, 10, 26, 0.98)",
    zIndex: 200,
  },
  label: {
    color: "#A78BFA",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 16,
  },
  number: {
    color: "#FFD700",
    fontSize: 140,
    fontWeight: "900",
    textShadowColor: "rgba(255, 215, 0, 0.4)",
    textShadowRadius: 40,
  },
});
