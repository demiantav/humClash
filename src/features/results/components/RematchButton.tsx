import { useEffect, useRef, useState } from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

type RematchStatus = "idle" | "sent" | "accepted";

interface RematchButtonProps {
  onPress: () => void;
  status: RematchStatus;
  disabled?: boolean;
}

export function RematchButton({ onPress, status, disabled }: RematchButtonProps) {
  const scale = useSharedValue(1);
  const pressStart = useRef(0);

  useEffect(() => {
    if (status === "accepted") {
      scale.value = withSequence(
        withSpring(1.15, { stiffness: 240, damping: 10 }),
        withSpring(1, { stiffness: 200, damping: 14 }),
      );
    }
  }, [status]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    pressStart.current = Date.now();
    scale.value = withSpring(0.95, { stiffness: 400, damping: 18 });
  };
  const handlePressOut = () => {
    const held = Date.now() - pressStart.current;
    scale.value = withSequence(
      withSpring(held > 60 ? 1.08 : 1, { stiffness: 320, damping: 12 }),
      withSpring(1, { stiffness: 200, damping: 14 }),
    );
  };
  const handlePress = () => {
    if (disabled || status !== "idle") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const label =
    status === "idle" ? "REVANCHA"
      : status === "sent" ? "ESPERANDO RIVAL…"
      : "¡ACEPTADA!";

  const isPending = status === "sent" || status === "accepted";

  return (
    <Animated.View style={[styles.wrapper, animStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || isPending}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        hitSlop={12}
      >
        {status === "sent" ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  button: {
    backgroundColor: "#7C4DFF",
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.12)",
  },
  buttonPressed: {
    backgroundColor: "#6A3FE0",
  },
  label: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
});