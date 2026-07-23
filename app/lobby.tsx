import { View, Text, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import { socket } from "../src/shared/lib/socket-client";
import { Button } from "../src/shared/components/Button";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Player {
  id: string;
  nickname: string;
  isReady: boolean;
  socketId: string;
}

interface Room {
  code: string;
  players: Player[];
  createdAt: number;
}

const CAROUSEL_SLIDES = [
  { emoji: "🎤", title: "Tarareá la canción", desc: "Vas a ver el título en tu pantalla. Tarareala como puedas." },
  { emoji: "👂", title: "Adiviná rápido", desc: "Tu rival escucha y elige entre 4 opciones. ¡Cuanto más rápido, más puntos!" },
  { emoji: "🔁", title: "Se invierten los roles", desc: "5 rondas. Cada uno tararea y adivina alternadamente." },
  { emoji: "🏆", title: "Gana el que suma más", desc: "Al final de las 5 rondas, el que tenga más puntos gana la partida." },
];

function BreathingLogo() {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);
  return (
    <Animated.View style={[{ transform: [{ scale: scale.value }] }]}>
      <Text style={styles.logo}>HumClash</Text>
    </Animated.View>
  );
}

function InstructionCarousel() {
  const [slide, setSlide] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSlide((s) => (s + 1) % CAROUSEL_SLIDES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 3800 });
  }, [slide]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const s = CAROUSEL_SLIDES[slide];
  return (
    <View style={styles.carousel}>
      <Text style={styles.carouselEmoji}>{s.emoji}</Text>
      <Text style={styles.carouselTitle}>{s.title}</Text>
      <Text style={styles.carouselDesc}>{s.desc}</Text>
      <View style={styles.carouselBar}>
        <Animated.View style={[styles.carouselBarFill, barStyle]} />
      </View>
    </View>
  );
}

function CountdownOverlay({ onFinish }: { onFinish: () => void }) {
  const count = useSharedValue(3);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const tick = () => {
      if (count.value <= 0) {
        runOnJS(onFinish)();
        return;
      }
      scale.value = 0.3;
      scale.value = withSpring(1, { stiffness: 300, damping: 10 });
      count.value = count.value - 1;
    };

    tick();
    const i1 = setTimeout(tick, 800);
    const i2 = setTimeout(tick, 1600);
    const i3 = setTimeout(tick, 2400);

    return () => {
      clearTimeout(i1);
      clearTimeout(i2);
      clearTimeout(i3);
    };
  }, []);

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.countdownOverlay}>
      <Text style={styles.countdownLabel}>¡Preparate!</Text>
      <Animated.Text style={[styles.countdownNumber, numberStyle]}>
        {Math.max(0, count.value)}
      </Animated.Text>
    </View>
  );
}

export default function LobbyScreen() {
  const { roomCode, nickname } = useLocalSearchParams<{ roomCode: string; nickname: string }>();
  const [players, setPlayers] = useState<Player[]>([{ id: "self", nickname: nickname ?? "", isReady: false, socketId: "" }]);
  const [isReady, setIsReady] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const navigateToGame = useCallback(() => {
    router.replace({ pathname: "/game", params: { roomCode, nickname } });
  }, [roomCode, nickname]);

  useEffect(() => {
    const onRoomJoined = ({ room }: { room: Room }) => {
      setPlayers(room.players);
    };
    const onPlayerReady = ({ room }: { room: Room }) => {
      setPlayers(room.players);
    };
    const onGameStarting = () => {
      setShowCountdown(true);
    };

    socket.on("room_joined", onRoomJoined);
    socket.on("player_ready_update", onPlayerReady);
    socket.on("game_starting", onGameStarting);

    return () => {
      socket.off("room_joined", onRoomJoined);
      socket.off("player_ready_update", onPlayerReady);
      socket.off("game_starting", onGameStarting);
    };
  }, []);

  const handleReady = () => {
    setIsReady(!isReady);
    socket.emit("player_ready", { roomCode });
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(String(roomCode));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    await Sharing.shareAsync(`Unite a mi sala en HumClash: ${roomCode}`, {
      dialogTitle: "Compartí el código de HumClash",
      mimeType: "text/plain",
    } as any);
  };

  if (showCountdown) {
    return (
      <SafeAreaView style={styles.container}>
        <CountdownOverlay onFinish={navigateToGame} />
      </SafeAreaView>
    );
  }

  const waiting = players.length < 2;

  return (
    <SafeAreaView style={styles.container}>
      <BreathingLogo />
      <Text style={styles.salaCode}>Sala: {roomCode}</Text>

      {waiting ? (
        <>
          <InstructionCarousel />

          <View style={styles.shareRow}>
            <Button variant="primary" size="sm" onPress={handleCopy}>
              <Text style={styles.btnText}>{copied ? "¡Copiado!" : "Copiar código"}</Text>
            </Button>
            <Button variant="secondary" size="sm" onPress={handleShare}>
              <Text style={styles.btnTextSecondary}>Compartir</Text>
            </Button>
          </View>
        </>
      ) : (
        <View style={styles.players}>
          {players.map((p) => (
            <View key={p.id} style={styles.playerCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{p.nickname[0]?.toUpperCase()}</Text>
              </View>
              <Text style={styles.playerName}>{p.nickname}</Text>
              <View style={[styles.readyDot, p.isReady ? styles.readyYes : styles.readyNo]} />
              <Text style={styles.readyText}>{p.isReady ? "Listo" : "Esperando..."}</Text>
            </View>
          ))}
        </View>
      )}

      <Button
        variant={isReady ? "ghost" : "primary"}
        size="lg"
        style={[styles.readyButton, isReady && styles.readyButtonActive]}
        onPress={handleReady}
      >
        <Text style={[styles.btnText, isReady && { color: "#00D4AA" }]}>
          {isReady ? "Listo ✓" : "¡Estoy listo!"}
        </Text>
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0A1A",
    alignItems: "center",
    padding: 24,
    paddingTop: 60,
  },
  logo: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FFD700",
    letterSpacing: 2,
    textShadowColor: "rgba(255,215,0,0.3)",
    textShadowRadius: 20,
  },
  salaCode: {
    fontSize: 18,
    color: "#A78BFA",
    marginTop: 4,
    marginBottom: 24,
    letterSpacing: 3,
  },
  carousel: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 16,
  },
  carouselEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  carouselTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  carouselDesc: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  carouselBar: {
    width: "60%",
    height: 3,
    backgroundColor: "#2D2B3E",
    borderRadius: 2,
    overflow: "hidden",
  },
  carouselBarFill: {
    height: "100%",
    backgroundColor: "#7C4DFF",
    borderRadius: 2,
  },
  shareRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
    marginBottom: 24,
  },
  players: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    gap: 12,
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1B2E",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#2D2B3E",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#7C4DFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
  },
  playerName: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  readyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  readyYes: { backgroundColor: "#00D4AA" },
  readyNo: { backgroundColor: "#FF6B6B" },
  readyText: {
    color: "#888",
    fontSize: 13,
  },
  readyButton: {
    width: "100%",
    marginBottom: 20,
  },
  readyButtonActive: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#00D4AA",
  },
  btnText: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  btnTextSecondary: { color: "#7C4DFF", fontSize: 14, fontWeight: "700" },
  countdownOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  countdownLabel: {
    color: "#A78BFA",
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
  },
  countdownNumber: {
    fontSize: 120,
    fontWeight: "900",
    color: "#FFD700",
    textShadowColor: "rgba(255,215,0,0.4)",
    textShadowRadius: 30,
  },
});
