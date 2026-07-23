import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { socket, connectSocket } from "../src/shared/lib/socket-client";
import { useGuestAuth } from "../src/features/auth-guest/hooks/useGuestAuth";
import { Button } from "../src/shared/components/Button";

function BreathingLogo() {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Text style={styles.title}>HumClash</Text>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { nickname } = useGuestAuth();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    connectSocket();
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BreathingLogo />
        <Text style={styles.subtitle}>Tarareá. Adiviná. Ganá.</Text>
        <View style={styles.statusRow}>
          <View style={[styles.dot, connected ? styles.dotGreen : styles.dotRed]} />
          <Text style={styles.nickname}>{nickname}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          variant="primary"
          size="lg"
          style={styles.fullWidth}
          onPress={() => router.push("/create-room")}
        >
          <Text style={styles.btnText}>Crear Sala</Text>
        </Button>

        <Button
          variant="secondary"
          size="lg"
          style={styles.fullWidth}
          onPress={() => router.push("/join-room")}
        >
          <Text style={styles.btnTextSecondary}>Unirse a Sala</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0A1A",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 64,
  },
  title: {
    fontSize: 52,
    fontWeight: "900",
    color: "#FFD700",
    letterSpacing: 3,
    marginBottom: 8,
    textShadowColor: "rgba(255,215,0,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 18,
    color: "#A78BFA",
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotGreen: { backgroundColor: "#00D4AA" },
  dotRed: { backgroundColor: "#FF6B6B" },
  nickname: {
    color: "#888",
    fontSize: 14,
  },
  actions: {
    width: "100%",
    gap: 16,
  },
  fullWidth: { width: "100%" },
  btnText: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  btnTextSecondary: { color: "#7C4DFF", fontSize: 20, fontWeight: "700" },
});
