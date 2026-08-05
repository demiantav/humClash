import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";
import { Song } from "../../../shared/types";
import { OptionButton } from "./OptionButton";
import { Button } from "../../../shared/components/Button";
import { ClipStatus } from "../../voice-recording/components/ClipStatus";

interface GuesserViewProps {
  options: Song[];
  timeLeft: number;
  timeLimit: number;
  hintVisible: boolean;
  currentSong: Song | null;
  hasSubmitted: boolean;
  lastGuess?: "correct" | "incorrect" | null;
  roundNumber: number;
  opponentNickname: string;
  onSubmitGuess: (songId: string) => void;
  clipReady: boolean;
  isAudioActive: boolean;
  audioError: string | null;
  relistenLeft: number;
  onRelisten: () => void;
}

export function GuesserView({
  options,
  timeLeft,
  timeLimit,
  hintVisible,
  currentSong,
  hasSubmitted,
  lastGuess,
  roundNumber,
  opponentNickname,
  onSubmitGuess,
  clipReady,
  isAudioActive,
  audioError,
  relistenLeft,
  onRelisten,
}: GuesserViewProps) {
  const timerRatio = timeLimit > 0 ? timeLeft / timeLimit : 1;

  if (!options || options.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Cargando opciones...</Text>
      </View>
    );
  }

  const rows = [options.slice(0, 2), options.slice(2, 4)];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.roundLabel}>Ronda {roundNumber}</Text>
        <Text style={styles.listeningText}>
          {clipReady ? `Escuchando a ${opponentNickname}...` : `Esperando a ${opponentNickname}...`}
        </Text>
        <ClipStatus
          nickname={opponentNickname}
          isActive={isAudioActive}
          isWaiting={!clipReady}
          error={audioError}
        />
      </View>

      <View style={styles.optionsArea}>
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.optionRow}>
            {row.map((song) => (
              <Animated.View
                key={song.id}
                entering={SlideInUp.delay(rowIdx * 100 + 200).springify()}
                style={styles.optionWrapper}
              >
                <OptionButton
                  title={song.title}
                  artist={song.artist}
                  onPress={() => onSubmitGuess(song.id)}
                  disabled={hasSubmitted || !clipReady}
                  state={
                    hasSubmitted && lastGuess === "correct"
                      ? "correct"
                      : hasSubmitted && lastGuess === "incorrect"
                        ? "incorrect"
                        : "idle"
                  }
                />
              </Animated.View>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.bottom}>
        {hintVisible && currentSong?.hint && !hasSubmitted && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.hint}>
            <Text style={styles.hintLabel}>Pista</Text>
            <Text style={styles.hintText}>{currentSong.hint}</Text>
          </Animated.View>
        )}

        {clipReady && relistenLeft > 0 && !hasSubmitted && (
          <Button variant="ghost" size="sm" onPress={onRelisten}>
            <Text style={styles.relistenText}>Escuchar de nuevo ({relistenLeft})</Text>
          </Button>
        )}

        <View style={styles.timerSection}>
          <Text style={[styles.timerText, timerRatio < 0.3 && styles.timerCritical]}>
            {clipReady ? `${timeLeft}s` : "—"}
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
  loading: {
    color: "#FFF",
    fontSize: 18,
    textAlign: "center",
    marginTop: 60,
  },
  header: {
    alignItems: "center",
    marginTop: 12,
  },
  roundLabel: {
    color: "#A78BFA",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
  },
  listeningText: {
    color: "#00D4AA",
    fontSize: 16,
    fontWeight: "600",
  },
  optionsArea: {
    flex: 1,
    justifyContent: "center",
    gap: 12,
  },
  optionRow: {
    flexDirection: "row",
    gap: 12,
  },
  optionWrapper: {
    flex: 1,
  },
  bottom: {
    alignItems: "center",
    gap: 12,
    paddingBottom: 20,
  },
  hint: {
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderRadius: 12,
    padding: 12,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  hintLabel: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  hintText: {
    color: "#FFF",
    fontSize: 14,
  },
  relistenText: {
    color: "#7C4DFF",
    fontSize: 14,
    fontWeight: "600",
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
});
