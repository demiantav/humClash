import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { socket, connectSocket } from "../src/shared/lib/socket-client";

export default function HomeScreen() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    connectSocket();
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>HumClash</Text>
        <Text style={styles.subtitle}>Tarareá. Adiviná. Ganá.</Text>
        <View style={styles.statusDot}>
          <View style={[styles.dot, connected ? styles.dotGreen : styles.dotRed]} />
          <Text style={styles.statusText}>
            {connected ? "Conectado" : "Conectando..."}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.button}
          onPress={() => router.push("/create-room")}
        >
          <Text style={styles.buttonText}>Crear Sala</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => router.push("/join-room")}
        >
          <Text style={[styles.buttonText, styles.buttonSecondaryText]}>
            Unirse a Sala
          </Text>
        </Pressable>
      </View>
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
  header: {
    alignItems: "center",
    marginBottom: 64,
  },
  title: {
    fontSize: 48,
    fontWeight: "900",
    color: "#FFD700",
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#A78BFA",
    marginBottom: 24,
  },
  statusDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotGreen: {
    backgroundColor: "#00D4AA",
  },
  dotRed: {
    backgroundColor: "#FF6B6B",
  },
  statusText: {
    color: "#888",
    fontSize: 14,
  },
  actions: {
    width: "100%",
    gap: 16,
  },
  button: {
    backgroundColor: "#7C4DFF",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#7C4DFF",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
  },
  buttonSecondaryText: {
    color: "#7C4DFF",
  },
});
