import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";

export default function GameScreen() {
  const { roomCode, nickname } = useLocalSearchParams<{
    roomCode: string;
    nickname: string;
  }>();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Juego</Text>
      <Text style={styles.info}>Sala: {roomCode}</Text>
      <Text style={styles.info}>Jugador: {nickname}</Text>
      <Text style={styles.placeholder}>El loop de juego se implementa en Fase 3</Text>
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
    marginBottom: 16,
  },
  info: {
    fontSize: 16,
    color: "#A78BFA",
    marginBottom: 8,
  },
  placeholder: {
    marginTop: 32,
    color: "#888",
    fontSize: 14,
    fontStyle: "italic",
  },
});
