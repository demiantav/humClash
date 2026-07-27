import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { Pressable, Text, View } from "react-native";
import { useEffect, useRef } from "react";
import * as Haptics from "expo-haptics";

interface RematchIncomingSheetProps {
  visible: boolean;
  rivalNickname: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function RematchIncomingSheet({
  visible,
  rivalNickname,
  onAccept,
  onDecline,
}: RematchIncomingSheetProps) {
  const translateY = useSharedValue(400);
  const backdropOpacity = useSharedValue(0);
  const acceptScale = useSharedValue(1);
  const pressStart = useRef(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(0.6, { duration: 200 });
      translateY.value = withSequence(
        withTiming(-20, { duration: 240, easing: Easing.out(Easing.ease) }),
        withSpring(0, { stiffness: 240, damping: 18 }),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      backdropOpacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(400, { duration: 200 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const acceptStyle = useAnimatedStyle(() => ({ transform: [{ scale: acceptScale.value }] }));

  const handleAcceptIn = () => {
    pressStart.current = Date.now();
    acceptScale.value = withSpring(0.95, { stiffness: 400, damping: 18 });
  };
  const handleAcceptOut = () => {
    const held = Date.now() - pressStart.current;
    acceptScale.value = withSequence(
      withSpring(held > 60 ? 1.08 : 1, { stiffness: 320, damping: 12 }),
      withSpring(1, { stiffness: 200, damping: 14 }),
    );
  };
  const handleAccept = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAccept();
  };
  const handleDecline = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDecline();
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]} pointerEvents={visible ? "auto" : "none"}>
      <Animated.View style={[styles.backdrop, backdropStyle]} />
      <Animated.View style={[styles.sheet, sheetStyle]}>
        <View style={styles.handle} />
        <Text style={styles.title}>¡Te desafían!</Text>
        <Text style={styles.subtitle}>
          <Text style={styles.rival}>{rivalNickname || "Tu rival"}</Text> quiere revancha.
        </Text>
        <Text style={styles.narrative}>
          Perdiste la primera, ¿vas a dejar que gane la serie?
        </Text>
        <Animated.View style={acceptStyle}>
          <Pressable
            onPress={handleAccept}
            onPressIn={handleAcceptIn}
            onPressOut={handleAcceptOut}
            style={({ pressed }) => [styles.acceptBtn, pressed && styles.acceptPressed]}
          >
            <Text style={styles.acceptLabel}>¡DALE, REVANCHA!</Text>
          </Pressable>
        </Animated.View>
        <Pressable onPress={handleDecline} style={styles.declineBtn}>
          <Text style={styles.declineLabel}>No, gracias</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#000000",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#1A1530",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 24,
    paddingBottom: 36,
    borderWidth: 2,
    borderColor: "rgba(124,77,255,0.4)",
  },
  handle: {
    width: 44,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    color: "#FFD700",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "#E5E5E5",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
  },
  rival: {
    color: "#A78BFA",
    fontWeight: "800",
  },
  narrative: {
    color: "#888",
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 24,
  },
  acceptBtn: {
    backgroundColor: "#7C4DFF",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    minHeight: 56,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.12)",
  },
  acceptPressed: {
    backgroundColor: "#6A3FE0",
  },
  acceptLabel: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  declineBtn: {
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    minHeight: 48,
  },
  declineLabel: {
    color: "#888",
    fontSize: 15,
    fontWeight: "700",
  },
});