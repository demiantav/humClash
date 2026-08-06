import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";
import { Song } from "../../../shared/types";
import { Button } from "../../../shared/components/Button";
import type { RecordPhase } from "../../voice-recording/hooks/useHumRecorder";

interface HummerViewProps {
  song: Song;
  timeLeft: number;
  timeLimit: number;
  roundNumber: number;
  opponentNickname: string;
  recordPhase: RecordPhase;
  recordCountdown: number;
  meteringLevel: number;
  recordError: string | null;
  onStartTake: () => void;
  onStopTake: () => void;
}

export function HummerView({
  song,
  timeLeft,
  timeLimit,
  roundNumber,
  opponentNickname,
  recordPhase,
  recordCountdown,
  meteringLevel,
  recordError,
  onStartTake,
  onStopTake,
}: HummerViewProps) {
  const songScale = useSharedValue(0.5);
  const songOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    songScale.value = withDelay(400, withSpring(1, { stiffness: 200, damping: 12 }));
    songOpacity.value = withTiming(1, { duration: 500 });

    pulseScale.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const songStyle = useAnimatedStyle(() => ({
    transform: [{ scale: songScale.value }],
    opacity: songOpacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const timerRatio = timeLimit > 0 ? timeLeft / timeLimit : 1;
  const barWidth = `${Math.round(meteringLevel * 100)}%` as const;

  const statusText = (() => {
    switch (recordPhase) {
      case "countdown":
        return recordCountdown > 0 ? String(recordCountdown) : "¡Ya!";
      case "recording":
        return "Grabando... ¡una sola toma!";
      case "uploading":
        return "Subiendo...";
      case "sent":
        return "¡Enviado!";
      case "error":
        return "Error al grabar/enviar";
      default:
        return `¡Tarareá para ${opponentNickname}!`;
    }
  })();

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.songCard, songStyle]}>
        <Text style={styles.roundLabel}>Ronda {roundNumber}</Text>
        <Text style={styles.songTitle}>{song.title}</Text>
        <Text style={styles.songArtist}>{song.artist}</Text>
        {song.hint && <Text style={styles.songHint}>Pista: {song.hint}</Text>}
      </Animated.View>

      <View style={styles.center}>
        <Text style={styles.instruction}>{statusText}</Text>

        {recordPhase === "idle" && (
          <View style={styles.countdownArea}>
            <Text style={styles.encouragement}>¡Dale! ¡No hay vergüenza!</Text>
            <Text style={styles.sub}>No hace falta cantar bien · máx. 20s · una toma</Text>
            <Button variant="primary" size="lg" onPress={onStartTake}>
              <Text style={styles.btnText}>🎤 Empezar a tararear</Text>
            </Button>
          </View>
        )}

        {recordPhase === "countdown" && (
          <Text style={styles.bigCountdown}>{recordCountdown || "¡Ya!"}</Text>
        )}

        {recordPhase === "recording" && (
          <View style={styles.micArea}>
            <Animated.View style={[styles.micIndicator, pulseStyle]}>
              <Text style={styles.micIcon}>🎤</Text>
              <View style={styles.levelTrack}>
                <View style={[styles.levelFill, { width: barWidth }]} />
              </View>
            </Animated.View>
            <Button variant="primary" size="lg" onPress={onStopTake}>
              <Text style={styles.btnText}>Listo · enviar</Text>
            </Button>
          </View>
        )}

        {recordPhase === "uploading" && (
          <Text style={styles.micText}>Subiendo clip...</Text>
        )}

        {recordPhase === "sent" && (
          <View style={styles.micArea}>
            <Text style={styles.sentIcon}>🚀</Text>
            <Text style={styles.micText}>¡Enviado! Esperá al rival</Text>
          </View>
        )}

        {recordError && <Text style={styles.error}>{recordError}</Text>}

        <View style={styles.timerSection}>
          <Text style={[styles.timerText, timerRatio < 0.3 && styles.timerCritical]}>
            {timeLeft}s
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  songCard: {
    backgroundColor: "rgba(124, 77, 255, 0.15)",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(124, 77, 255, 0.3)",
    marginTop: 12,
  },
  roundLabel: {
    color: "#A78BFA",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 8,
  },
  songTitle: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 4,
  },
  songArtist: {
    color: "#A78BFA",
    fontSize: 16,
    marginBottom: 8,
  },
  songHint: {
    color: "#FFD700",
    fontSize: 13,
    fontStyle: "italic",
    opacity: 0.8,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  instruction: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  countdownArea: {
    alignItems: "center",
    gap: 12,
  },
  encouragement: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  sub: {
    color: "#888",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 4,
  },
  bigCountdown: {
    color: "#FFD700",
    fontSize: 72,
    fontWeight: "900",
  },
  micIndicator: {
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  micArea: {
    alignItems: "center",
    gap: 16,
    width: "100%",
  },
  micIcon: {
    fontSize: 64,
  },
  sentIcon: {
    fontSize: 48,
  },
  micText: {
    color: "#00D4AA",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  levelTrack: {
    width: "70%",
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2D2B3E",
    overflow: "hidden",
  },
  levelFill: {
    height: "100%",
    backgroundColor: "#00D4AA",
  },
  error: {
    color: "#FF6B6B",
    fontSize: 13,
    textAlign: "center",
  },
  timerSection: {
    alignItems: "center",
  },
  timerText: {
    color: "#FFF",
    fontSize: 36,
    fontWeight: "900",
  },
  timerCritical: {
    color: "#FF6B6B",
  },
  btnText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
