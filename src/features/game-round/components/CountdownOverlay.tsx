import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { useEffect, useState, useRef } from "react";
import * as Haptics from "expo-haptics";

interface CountdownOverlayProps {
  onFinish: () => void;
  tick?: number | null;
}

const TICK_DURATION = 800;

export function CountdownOverlay({ onFinish, tick }: CountdownOverlayProps) {
  const [display, setDisplay] = useState<string>("...");
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);
  const prevRef = useRef<number | null>(null);

  useEffect(() => {
    if (tick === undefined || tick === null) return;
    if (tick === prevRef.current) return;
    prevRef.current = tick;

    if (tick <= 0) {
      setDisplay("YA");
      scale.value = withSpring(1.5, { stiffness: 300, damping: 10 });
      opacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 500 }),
      );
      setTimeout(() => onFinish(), 600);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    setDisplay(String(tick));
    scale.value = 0.3;
    scale.value = withSpring(1, { stiffness: 300, damping: 10 });
    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0.6, { duration: TICK_DURATION - 100 }),
    );

    if (tick === 3 || tick === 2) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (tick === 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }, [tick]);

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.overlay}>
      <Text style={styles.label}>¡Preparate!</Text>
      <Animated.Text style={[styles.number, numberStyle]}>
        {display}
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
