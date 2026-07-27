import { Pressable, Text, StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
}

export function SecondaryButton({ label, onPress }: SecondaryButtonProps) {
  const scale = useSharedValue(1);
  const pressStart = useRef(0);

  const handlePressIn = () => {
    pressStart.current = Date.now();
    scale.value = withSpring(0.95, { stiffness: 400, damping: 18 });
  };
  const handlePressOut = () => {
    const held = Date.now() - pressStart.current;
    scale.value = withSequence(
      withSpring(held > 60 ? 1.05 : 1, { stiffness: 320, damping: 12 }),
      withSpring(1, { stiffness: 200, damping: 14 }),
    );
  };
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.wrapper, animStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        hitSlop={12}
      >
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%" },
  button: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.16)",
  },
  buttonPressed: {
    borderColor: "rgba(255,255,255,0.32)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  label: {
    color: "#E5E5E5",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});