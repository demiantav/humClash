import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import Animated from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { socket } from "../src/shared/lib/socket-client";
import { useGameRound } from "../src/features/game-round/hooks/useGameRound";
import { TimerBar } from "../src/features/game-round/components/TimerBar";
import { HummerView } from "../src/features/game-round/components/HummerView";
import { GuesserView } from "../src/features/game-round/components/GuesserView";
import { ComboCounter } from "../src/features/game-round/components/ComboCounter";
import { RoundProgressDots } from "../src/features/game-round/components/RoundProgressDots";
import { CountdownOverlay } from "../src/features/game-round/components/CountdownOverlay";
import { RoleBackground } from "../src/features/game-round/components/RoleBackground";
import { useScreenShake } from "../src/features/game-round/animations/screenShake";
import { MuteButton, ReportButton } from "../src/features/moderation/components/MuteButton";
import { useAgora } from "../src/features/voice-stream/hooks/useAgora";

export default function GameScreen() {
  const { roomCode, nickname } = useLocalSearchParams<{
    roomCode: string;
    nickname: string;
  }>();

  const game = useGameRound(String(roomCode ?? ""));
  const agora = useAgora(String(roomCode ?? ""), game.myRole);
  const { animatedStyle: shakeStyle, trigger: shake } = useScreenShake();
  const [showCountdown, setShowCountdown] = useState(false);
  const [showTransition, setShowTransition] = useState("");
  const [pastResults, setPastResults] = useState<(boolean | null)[]>([]);

  useEffect(() => {
    if (game.phase === "countdown" || game.phase === "lobby") {
      setShowCountdown(true);
    } else {
      setShowCountdown(false);
    }
  }, [game.phase, game.currentRound]);

  useEffect(() => {
    if (game.lastGuessCorrect === true) {
      shake(5);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (game.lastGuessCorrect === false) {
      shake(8);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [game.lastGuessCorrect, game.currentRound]);

  useEffect(() => {
    if (game.roundResult) {
      const newResults = [...pastResults, game.roundResult.correct];
      setPastResults(newResults);
    }
  }, [game.roundResult]);

  useEffect(() => {
    if (game.phase === "game_over" && game.gameOver) {
      const winner = game.gameOver.winner;
      if (winner) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setTimeout(() => {
        router.replace({
          pathname: "/results",
          params: {
            roomCode,
            nickname,
          },
        });
      }, 1500);
    }
  }, [game.phase, game.gameOver]);

  if (game.phase === "lobby" || game.phase === "countdown") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CountdownOverlay onFinish={() => setShowCountdown(false)} tick={game.countdownValue} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <RoleBackground role={game.myRole}>
        <Animated.View style={[styles.inner, shakeStyle]}>
          <View style={styles.hud}>
            <View style={styles.hudTop}>
              <View style={styles.hudLeft}>
                <MuteButton
                  roomCode={String(roomCode ?? "")}
                  targetNickname={game.opponentNickname}
                  onMuteRemote={agora.muteRemote}
                  onUnmuteRemote={agora.unmuteRemote}
                />
                <ReportButton
                  roomCode={String(roomCode ?? "")}
                  targetNickname={game.opponentNickname}
                />
              </View>
              <ComboCounter combo={game.comboCount} />
              <View style={styles.hudRight}>
                <Text style={styles.roleLabel}>
                  {game.myRole === "hummer" ? "Tarareás" : "Adivinás"}
                </Text>
              </View>
            </View>

            <TimerBar
              timeLeft={game.timeLeft}
              timeLimit={game.timeLimit}
              secondsElapsed={game.timeLimit - game.timeLeft}
              serverTimestamp={game.serverTimestamp}
            />

            <RoundProgressDots
              currentRound={game.currentRound}
              totalRounds={game.totalRounds}
              roundResults={pastResults}
            />
          </View>

          <View style={styles.gameArea}>
            {game.myRole === "hummer" && game.currentSong ? (
              <HummerView
                song={game.currentSong}
                timeLeft={game.timeLeft}
                timeLimit={game.timeLimit}
                onStartHumming={game.startHumming}
                roundNumber={game.currentRound}
                opponentNickname={game.opponentNickname}
                isMuted={agora.isMuted}
                isSpeaking={agora.isSpeaking}
                agoraError={agora.error}
                onToggleMute={agora.toggleMute}
              />
            ) : game.myRole === "guesser" ? (
              <GuesserView
                options={game.options}
                timeLeft={game.timeLeft}
                timeLimit={game.timeLimit}
                hintVisible={game.hintVisible}
                currentSong={game.currentSong}
                rehumAvailable={game.rehumAvailable}
                hasSubmitted={game.hasSubmitted}
                lastGuess={game.lastGuessCorrect === true ? "correct" : game.lastGuessCorrect === false ? "incorrect" : null}
                roundNumber={game.currentRound}
                opponentNickname={game.opponentNickname}
                onSubmitGuess={game.submitGuess}
                onRequestRehum={game.requestRehum}
                remoteAudioLevel={agora.remoteAudioLevel}
                isAudioActive={agora.isJoined}
                agoraError={agora.error}
              />
            ) : (
              <View style={styles.waiting}>
                <Text style={styles.waitingText}>Preparando ronda...</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </RoleBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F0A1A",
  },
  inner: {
    flex: 1,
  },
  hud: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  hudTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hudLeft: {
    flexDirection: "row",
    gap: 8,
  },
  hudRight: {
    alignItems: "flex-end",
  },
  roleLabel: {
    color: "#A78BFA",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  gameArea: {
    flex: 1,
  },
  waiting: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  waitingText: {
    color: "#666",
    fontSize: 18,
  },
});
