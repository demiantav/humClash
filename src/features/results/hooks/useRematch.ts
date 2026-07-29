import { useState, useCallback, useEffect } from "react";
import { router } from "expo-router";
import { socket } from "../../../shared/lib/socket-client";
import { useGameStore } from "../../../store/useGameStore";

type RematchStatus = "idle" | "sent" | "accepted";

interface UseRematchResult {
  status: RematchStatus;
  rivalWantsRematch: boolean;
  requestRematch: () => void;
  acceptRematch: () => void;
  declineRematch: () => void;
}

export function useRematch(
  roomCode: string,
  options: { onAcceptedNavigate: () => void },
): UseRematchResult {
  const [status, setStatus] = useState<RematchStatus>("idle");

  const rivalWantsRematch = useGameStore((s) => s.rematchRequestedByRival);
  const setRivalFlag = useGameStore((s) => s.setRematchRequestedByRival);
  const resetGame = useGameStore((s) => s.reset);

  const handleRematchAccepted = useCallback(() => {
    setStatus("accepted");
    setRivalFlag(false);
    resetGame();
    options.onAcceptedNavigate();
  }, [options, resetGame, setRivalFlag]);

  useEffect(() => {
    socket.on("rematch_accepted", handleRematchAccepted);
    return () => {
      socket.off("rematch_accepted", handleRematchAccepted);
    };
  }, [handleRematchAccepted]);

  const requestRematch = useCallback(() => {
    setStatus("sent");
    socket.emit("request_rematch", { roomCode });
  }, [roomCode]);

  const acceptRematch = useCallback(() => {
    socket.emit("accept_rematch", { roomCode });
    setRivalFlag(false);
    setStatus("accepted");
    resetGame();
    options.onAcceptedNavigate();
  }, [roomCode, options, resetGame, setRivalFlag]);

  const declineRematch = useCallback(() => {
    setRivalFlag(false);
    setStatus("idle");
  }, [setRivalFlag]);

  return {
    status,
    rivalWantsRematch,
    requestRematch,
    acceptRematch,
    declineRematch,
  };
}