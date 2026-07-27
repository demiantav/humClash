import { useState, useEffect, useCallback, useRef } from "react";
import { socket } from "../../../shared/lib/socket-client";
import { useGameStore } from "../../../store/useGameStore";
import { Song, ScoreEntry } from "../../../shared/types";
import {
  NewRoundData,
  TimerSyncData,
  RoundResultData,
  GameOverData,
} from "../socket-events";

export function useGameRound(roomCode: string) {
  const {
    phase,
    myRole,
    currentRound,
    totalRounds,
    currentSong,
    options,
    scores,
    timeLeft,
    timeLimit,
    serverTimestamp,
    comboCount,
    gameOver,
    setPhase,
    setMyRole,
    setRound,
    setCurrentSong,
    setOptions,
    setScores,
    setTimeLeft,
    setTimeLimit,
    setServerTimestamp,
    setGameOver,
    incrementCombo,
    resetCombo,
    reset,
  } = useGameStore();

  const [opponentNickname, setOpponentNickname] = useState("");
  const [roundResult, setRoundResult] = useState<RoundResultData | null>(null);
  const [lastGuessCorrect, setLastGuessCorrect] = useState<boolean | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [rehumAvailable, setRehumAvailable] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [hummingStarted, setHummingStarted] = useState(false);
  const timeLimitRef = useRef(0);

  useEffect(() => {
    const onGameStarting = (data: { round: number; totalRounds: number }) => {
      setPhase("countdown");
      setRound(data.round);
    };

    const onCountdownTick = (data: { count: number }) => {
      setCountdownValue(data.count);
    };

    const onHummingStarted = () => {
      setHummingStarted(true);
    };

    const onNewRound = (data: NewRoundData) => {
      setPhase("playing");
      setMyRole(data.yourRole);
      setRound(data.roundNumber);
      setCurrentSong(data.song);
      setOptions(data.options);
      setTimeLeft(data.timeLimit);
      setTimeLimit(data.timeLimit);
      setOpponentNickname(data.opponentNickname);
      setRoundResult(null);
      setLastGuessCorrect(null);
      setHintVisible(false);
      setRehumAvailable(true);
      setHasSubmitted(false);
      setCountdownValue(null);
      setHummingStarted(false);
      timeLimitRef.current = data.timeLimit;
    };

    const onTimerSync = (data: TimerSyncData) => {
      timeLimitRef.current = data.timeLimit;
      const elapsed = data.secondsElapsed + (Date.now() - data.serverTimestamp) / 1000;
      const remaining = Math.max(0, data.timeLimit - elapsed);
      setTimeLeft(Math.ceil(remaining));
      setTimeLimit(data.timeLimit);
      setServerTimestamp(data.serverTimestamp);

      if (data.secondsElapsed >= 10 && myRole === "guesser") {
        setHintVisible(true);
      }
    };

    const onRoundResult = (data: RoundResultData) => {
      setPhase("result");
      setRoundResult(data);
      setScores(data.scores);
      setLastGuessCorrect(data.correct);

      if (data.correct) {
        incrementCombo();
      } else {
        resetCombo();
      }
    };

    const onGameOver = (data: GameOverData) => {
      setPhase("game_over");
      setGameOver(data);
      setScores(data.scores);
    };

    const onRematchRequested = () => {
      useGameStore.getState().setRematchRequestedByRival(true);
    };

    const onRematchAccepted = () => {
      useGameStore.getState().setRematchRequestedByRival(false);
    };

    const onRehumRequested = (data: { message: string }) => {
      setRehumAvailable(false);
    };

    socket.on("game_starting", onGameStarting);
    socket.on("countdown_tick", onCountdownTick);
    socket.on("humming_started", onHummingStarted);
    socket.on("new_round", onNewRound);
    socket.on("timer_sync", onTimerSync);
    socket.on("round_result", onRoundResult);
    socket.on("game_over", onGameOver);
    socket.on("rehum_requested", onRehumRequested);
    socket.on("rematch_requested", onRematchRequested);
    socket.on("rematch_accepted", onRematchAccepted);

    return () => {
      socket.off("game_starting", onGameStarting);
      socket.off("countdown_tick", onCountdownTick);
      socket.off("humming_started", onHummingStarted);
      socket.off("new_round", onNewRound);
      socket.off("timer_sync", onTimerSync);
      socket.off("round_result", onRoundResult);
      socket.off("game_over", onGameOver);
      socket.off("rehum_requested", onRehumRequested);
      socket.off("rematch_requested", onRematchRequested);
      socket.off("rematch_accepted", onRematchAccepted);
    };
  }, [myRole]);

  const submitGuess = useCallback(
    (songId: string) => {
      if (hasSubmitted || myRole !== "guesser") return;
      setHasSubmitted(true);
      socket.emit("submit_guess", { roomCode, songId });
    },
    [roomCode, hasSubmitted, myRole],
  );

  const startHumming = useCallback(() => {
    socket.emit("start_humming", { roomCode });
  }, [roomCode]);

  const requestRehum = useCallback(() => {
    if (!rehumAvailable) return;
    socket.emit("request_rehum", { roomCode });
    setRehumAvailable(false);
  }, [roomCode, rehumAvailable]);

  const requestRematch = useCallback(() => {
    socket.emit("request_rematch", { roomCode });
  }, [roomCode]);

  const leaveGame = useCallback(() => {
    socket.emit("leave_room", { roomCode });
    reset();
  }, [roomCode, reset]);

  return {
    phase,
    myRole,
    currentRound,
    totalRounds,
    currentSong,
    options,
    scores,
    timeLeft,
    timeLimit,
    serverTimestamp,
    comboCount,
    opponentNickname,
    roundResult,
    gameOver,
    lastGuessCorrect,
    hintVisible,
    rehumAvailable,
    hasSubmitted,
    countdownValue,
    hummingStarted,
    submitGuess,
    startHumming,
    requestRehum,
    requestRematch,
    leaveGame,
    reset,
  };
}
