import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { socket } from "../src/shared/lib/socket-client";

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

export default function LobbyScreen() {
  const { roomCode, nickname } = useLocalSearchParams<{
    roomCode: string;
    nickname: string;
  }>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    socket.on("room_joined", ({ room }: { room: Room }) => {
      setPlayers(room.players);
    });

    socket.on("player_ready_update", ({ room }: { room: Room }) => {
      setPlayers(room.players);
    });

    socket.on("game_starting", () => {
      router.push({
        pathname: "/game",
        params: { roomCode, nickname },
      });
    });

    return () => {
      socket.off("room_joined");
      socket.off("player_ready_update");
      socket.off("game_starting");
    };
  }, [roomCode, nickname]);

  const handleReady = () => {
    setIsReady(!isReady);
    socket.emit("player_ready", { roomCode });
  };

  const bothReady = players.length === 2 && players.every((p) => p.isReady);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Lobby</Text>
      <Text style={styles.roomCode}>Sala: {roomCode}</Text>

      <View style={styles.players}>
        {players.map((p) => (
          <View key={p.id} style={styles.playerCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{p.nickname[0]?.toUpperCase()}</Text>
            </View>
            <Text style={styles.playerName}>{p.nickname}</Text>
            <View style={[styles.readyDot, p.isReady ? styles.readyYes : styles.readyNo]} />
            <Text style={styles.readyText}>{p.isReady ? "Listo" : "Pensando..."}</Text>
          </View>
        ))}
        {players.length < 2 && (
          <Text style={styles.waiting}>Esperando rival...</Text>
        )}
      </View>

      <Pressable
        style={[styles.button, isReady && styles.buttonReady]}
        onPress={handleReady}
      >
        <Text style={styles.buttonText}>
          {isReady ? "Listo ✓" : "Marcar como listo"}
        </Text>
      </Pressable>

      {bothReady && (
        <Text style={styles.startingText}>¡Que empiece el juego!</Text>
      )}
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
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FFD700",
    marginBottom: 8,
  },
  roomCode: {
    fontSize: 20,
    color: "#A78BFA",
    marginBottom: 40,
    letterSpacing: 4,
  },
  players: {
    width: "100%",
    gap: 16,
    marginBottom: 48,
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1B2E",
    padding: 16,
    borderRadius: 16,
    gap: 12,
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
  readyYes: {
    backgroundColor: "#00D4AA",
  },
  readyNo: {
    backgroundColor: "#FF6B6B",
  },
  readyText: {
    color: "#888",
    fontSize: 14,
  },
  waiting: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
  },
  button: {
    width: "100%",
    backgroundColor: "#7C4DFF",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonReady: {
    backgroundColor: "#00D4AA",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
  },
  startingText: {
    color: "#FFD700",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "600",
  },
});
