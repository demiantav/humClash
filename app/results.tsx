import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated from "react-native-reanimated";

import { useGameStore } from "../src/store/useGameStore";
import { useAuthStore } from "../src/store/useAuthStore";
import { useRoomStore } from "../src/store/useRoomStore";
import { socket } from "../src/shared/lib/socket-client";
import { useRematch } from "../src/features/results/hooks/useRematch";
import { Confetti } from "../src/features/results/animations/Confetti";
import { WinnerBanner } from "../src/features/results/components/WinnerBanner";
import { RoundScoreTable } from "../src/features/results/components/RoundScoreTable";
import { RematchButton } from "../src/features/results/components/RematchButton";
import { SecondaryButton } from "../src/features/results/components/SecondaryButton";
import { RematchIncomingSheet } from "../src/features/results/components/RematchIncomingSheet";
import { useScreenShake } from "../src/features/game-round/animations/screenShake";

type Outcome = "win" | "lose" | "tie";

function buildNarrative(
  outcome: Outcome,
  myNickname: string,
  myTotal: number,
  rivalTotal: number,
  rounds: { correct: boolean; guesserNickname: string; timeTaken: number }[],
): string {
  if (outcome === "tie") return "Serie empatada — ¿desempate?";
  if (outcome === "win") {
    const diff = myTotal - rivalTotal;
    if (diff >= 10) return "Ganaste por paliza 🏆";
    return `Ganaste la serie ${myTotal} a ${rivalTotal}. ¡Bien jugado!`;
  }
  const myFastHits = rounds.filter(
    (r) => r.correct && r.guesserNickname === myNickname && r.timeTaken > 0 && r.timeTaken < 3,
  ).length;
  const myHits = rounds.filter(
    (r) => r.correct && r.guesserNickname === myNickname,
  ).length;
  if (myFastHits > 0) {
    return `Adivinaste ${myFastHits} en menos de 3 segundos. ¡La próxima es tuya!`;
  }
  if (myHits > 0) {
    return `Acertaste ${myHits} — el rival tuvo mejor oído. ¡Revancha!`;
  }
  return "¡La próxima es tuya!";
}

export default function ResultsScreen() {
  const params = useLocalSearchParams<{
    roomCode: string;
    nickname: string;
  }>();
  const roomCode = String(params.roomCode ?? "");
  const nicknameParam = String(params.nickname ?? "");

  const gameOver = useGameStore((s) => s.gameOver);
  const resetGame = useGameStore((s) => s.reset);

  const authNickname = useAuthStore((s) => s.nickname);
  const roomNickname = useRoomStore((s) => s.nickname);
  const myNickname = nicknameParam || roomNickname || authNickname || "";

  const { animatedStyle: shakeStyle, trigger: shake } = useScreenShake();

  const navigateToGame = () => {
    router.replace({
      pathname: "/game",
      params: { roomCode, nickname: myNickname },
    });
  };

  const rematch = useRematch(roomCode, { onAcceptedNavigate: navigateToGame });

  // Datos derivados
  const derived = useMemo(() => {
    if (!gameOver) {
      return {
        outcome: "tie" as Outcome,
        rivalNickname: "Rival",
        myTotal: 0,
        rivalTotal: 0,
        roundsForTable: [],
        myIndex: 0,
        rivalIndex: 1,
      };
    }
    const scoreEntries = gameOver.scores;
    let myIndex = scoreEntries.findIndex((s) => s.nickname === myNickname);
    if (myIndex < 0) myIndex = 0;
    const rivalIndex = myIndex === 0 ? 1 : 0;
    const me = scoreEntries[myIndex];
    const rival = scoreEntries[rivalIndex];
    const myTotal = me?.totalScore ?? 0;
    const rivalTotal = rival?.totalScore ?? 0;
    const winner = gameOver.winner;
    let outcome: Outcome = "tie";
    if (winner) {
      outcome = winner.nickname === myNickname ? "win" : "lose";
    } else {
      outcome = myTotal > rivalTotal ? "win" : myTotal < rivalTotal ? "lose" : "tie";
    }
    return {
      outcome,
      rivalNickname: rival?.nickname ?? "Rival",
      myTotal,
      rivalTotal,
      roundsForTable: gameOver.rounds,
      myIndex,
      rivalIndex,
    };
  }, [gameOver, myNickname]);

  const narrative = useMemo(
    () =>
      buildNarrative(
        derived.outcome,
        myNickname,
        derived.myTotal,
        derived.rivalTotal,
        derived.roundsForTable as any,
      ),
    [derived, myNickname],
  );

  // Haptics + shake al montar según resultado
  useEffect(() => {
    if (derived.outcome === "win") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      shake(6);
    } else if (derived.outcome === "lose") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shake(4);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const handleLeave = () => {
    socket.emit("leave_room", { roomCode });
    resetGame();
    router.replace("/");
  };

  if (!gameOver) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Sin resultados</Text>
          <Text style={styles.emptyText}>No hay datos del juego.</Text>
          <SecondaryButton label="Volver al inicio" onPress={handleLeave} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Confetti play={derived.outcome === "win"} />

      <Animated.View style={[styles.scrollWrap, shakeStyle]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <WinnerBanner
            outcome={derived.outcome}
            myNickname={myNickname}
            rivalNickname={derived.rivalNickname}
            myTotal={derived.myTotal}
            rivalTotal={derived.rivalTotal}
          />

          <Text style={styles.narrative}>{narrative}</Text>

          <View style={styles.tableWrap}>
            <Text style={styles.sectionLabel}>Rondas</Text>
            <RoundScoreTable
              rounds={derived.roundsForTable as any}
              myNickname={myNickname}
              rivalNickname={derived.rivalNickname}
            />
          </View>

          <View style={styles.actions}>
            <RematchButton
              onPress={rematch.requestRematch}
              status={rematch.status}
              disabled={rematch.rivalWantsRematch}
            />
            {(rematch.status === "idle" || rematch.status === "sent") && (
              <SecondaryButton label="Volver al inicio" onPress={handleLeave} />
            )}
          </View>
        </ScrollView>
      </Animated.View>

      <RematchIncomingSheet
        visible={rematch.rivalWantsRematch}
        rivalNickname={derived.rivalNickname}
        onAccept={rematch.acceptRematch}
        onDecline={rematch.declineRematch}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0A1A",
  },
  scrollWrap: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 20,
  },
  narrative: {
    color: "#E5E5E5",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  tableWrap: {
    gap: 8,
  },
  sectionLabel: {
    color: "#A78BFA",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginLeft: 4,
  },
  actions: {
    gap: 12,
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  emptyTitle: {
    color: "#FFD700",
    fontSize: 28,
    fontWeight: "900",
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
    marginBottom: 16,
    fontStyle: "italic",
  },
});