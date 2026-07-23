import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  withSequence,
} from "react-native-reanimated";
import { useEffect } from "react";

interface ComboCounterProps {
  combo: number;
}

function getComboLabel(count: number): string {
  if (count >= 7) return `GODLIKE x${count}`;
  if (count >= 5) return `ON FIRE x${count}`;
  if (count >= 3) return `COMBO x${count}`;
  if (count >= 1) return `x${count}`;
  return "";
}

function getComboColor(count: number): string {
  if (count >= 7) return "#FFD700";
  if (count >= 5) return "#FF6B35";
  if (count >= 3) return "#FFB800";
  return "#FFFFFF";
}

export function ComboCounter({ combo }: ComboCounterProps) {
  const scale = useSharedValue(0);
  const prevCombo = useSharedValue(0);

  useEffect(() => {
    if (combo > 0 && combo > prevCombo.value) {
      scale.value = withSequence(
        withSpring(1.6, { stiffness: 300, damping: 8 }),
        withSpring(1, { stiffness: 200, damping: 12 }),
      );
    }
    if (combo === 0) {
      scale.value = withTiming(0, { duration: 300 });
    }
    prevCombo.value = combo;
  }, [combo]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: combo > 0 ? withTiming(1, { duration: 200 }) : 0,
  }));

  if (combo === 0) return null;

  const color = getComboColor(combo);
  const label = getComboLabel(combo);

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  text: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
