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
import { useEffect, useState } from "react";
import { Song } from "../../../shared/types";
import { Button } from "../../../shared/components/Button";

interface HummerViewProps {
  song: Song;
  timeLeft: number;
  timeLimit: number;
  onStartHumming: () => void;
  roundNumber: number;
  opponentNickname: string;
}

export function HummerView({
  song,
  timeLeft,
  timeLimit,
  onStartHumming,
  roundNumber,
  opponentNickname,
}: HummerViewProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const songScale = useSharedValue(0.5);
  const songOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    songScale.value = withDelay(
      400,
      withSpring(1, { stiffness: 200, damping: 12 }),
    );
    songOpacity.value = withTiming(1, { duration: 500 });

    pulseScale.value = withDelay(
      1500,
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
    opacity: hasStarted ? 1 : withTiming(1, { duration: 300 }),
  }));

  const handleStart = () => {
    setHasStarted(true);
    onStartHumming();
  };

  const timerRatio = timeLimit > 0 ? timeLeft / timeLimit : 1;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.songCard, songStyle]}>
        <Text style={styles.roundLabel}>Ronda {roundNumber}</Text>
        <Text style={styles.songTitle}>{song.title}</Text>
        <Text style={styles.songArtist}>{song.artist}</Text>
        {song.hint && (
          <Text style={styles.songHint}>Pista: {song.hint}</Text>
        )}
      </Animated.View>

      <View style={styles.center}>
        <Text style={styles.instruction}>
          ¡Tarareá para {opponentNickname}!
        </Text>

        {!hasStarted ? (
          <View style={styles.countdownArea}>
            <Text style={styles.encouragement}>
              ¡Dale! ¡No hay vergüenza!
            </Text>
            <Button variant="primary" size="lg" onPress={handleStart}>
              <Text style={styles.btnText}>🎤 Empezar a tararear</Text>
            </Button>
          </View>
        ) : (
          <Animated.View style={[styles.micIndicator, pulseStyle]}>
            <Text style={styles.micIcon}>🎤</Text>
            <Text style={styles.micText}>Tarareando...</Text>
            <Text style={styles.micSubtext}>Tu rival te está escuchando</Text>
          </Animated.View>
        )}

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
  micIndicator: {
    alignItems: "center",
    gap: 8,
  },
  micIcon: {
    fontSize: 64,
  },
  micText: {
    color: "#00D4AA",
    fontSize: 24,
    fontWeight: "700",
  },
  micSubtext: {
    color: "#666",
    fontSize: 14,
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
