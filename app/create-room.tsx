import { View, Text, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import { socket } from "../src/shared/lib/socket-client";
import { useGuestAuth } from "../src/features/auth-guest/hooks/useGuestAuth";
import { Button } from "../src/shared/components/Button";

function CodeReveal({ code }: { code: string }) {
  const chars = code.split("");

  return (
    <View style={styles.codeRow}>
      {chars.map((char, i) => (
        <CodeChar key={i} char={char} index={i} />
      ))}
    </View>
  );
}

function CodeChar({ char, index }: { char: string; index: number }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withDelay(
      index * 150,
      withTiming(1, { duration: 300 }),
    );
    scale.value = withDelay(
      index * 150,
      withSpring(1, { stiffness: 200, damping: 10 }),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.codeCell, animatedStyle]}>
      <Text style={styles.codeChar}>{char}</Text>
    </Animated.View>
  );
}

export default function CreateRoomScreen() {
  const { nickname } = useGuestAuth();
  const [roomCode, setRoomCode] = useState("");
  const [created, setCreated] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = () => {
    if (!nickname) return;
    socket.emit("create_room", { nickname }, (response: any) => {
      if (response.success) {
        setRoomCode(response.roomCode);
        setCreated(true);
      }
    });
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    await Sharing.shareAsync(`Unite a mi sala en HumClash: ${roomCode}`, {
      dialogTitle: "Compartí el código de HumClash",
      mimeType: "text/plain",
    } as any);
  };

  const handleEnterLobby = () => {
    router.push({ pathname: "/lobby", params: { roomCode, nickname } });
  };

  if (created) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>¡Sala Creada!</Text>
        <CodeReveal code={roomCode} />

        <View style={styles.shareRow}>
          <Button variant="primary" size="md" onPress={handleCopy}>
            <Text style={styles.btnText}>{copied ? "¡Copiado!" : "Copiar"}</Text>
          </Button>
          <Button variant="secondary" size="md" onPress={handleShare}>
            <Text style={styles.btnTextSecondary}>Compartir</Text>
          </Button>
        </View>

        <View style={styles.waitingSection}>
          <Text style={styles.waitingText}>Esperando que tu amigo se una...</Text>
          <Text style={styles.waitingHint}>
            Compartile el código por WhatsApp, Instagram o donde quieras.
          </Text>
        </View>

        <Button variant="primary" size="lg" style={styles.fullWidth} onPress={handleEnterLobby}>
          <Text style={styles.btnText}>Entrar al Lobby</Text>
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Crear Sala</Text>

      <Text style={styles.label}>Jugando como</Text>
      <View style={styles.nicknameBox}>
        <Text style={styles.nicknameText}>{nickname}</Text>
      </View>

      <Button variant="primary" size="lg" style={styles.fullWidth} onPress={handleCreate}>
        <Text style={styles.btnText}>Crear</Text>
      </Button>

      <Button variant="ghost" size="sm" onPress={() => router.back()}>
        <Text style={styles.backLink}>Volver</Text>
      </Button>
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
    marginBottom: 32,
  },
  label: {
    color: "#A78BFA",
    fontSize: 14,
    marginBottom: 8,
    alignSelf: "flex-start",
    fontWeight: "600",
  },
  nicknameBox: {
    width: "100%",
    backgroundColor: "#1E1B2E",
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#2D2B3E",
  },
  nicknameText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
  codeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  codeCell: {
    width: 48,
    height: 60,
    backgroundColor: "#1E1B2E",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#00D4AA",
  },
  codeChar: {
    fontSize: 28,
    fontWeight: "900",
    color: "#00D4AA",
  },
  shareRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  waitingSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  waitingText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  waitingHint: {
    color: "#666",
    fontSize: 13,
    textAlign: "center",
  },
  fullWidth: { width: "100%" },
  btnText: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  btnTextSecondary: { color: "#7C4DFF", fontSize: 18, fontWeight: "700" },
  backLink: { color: "#A78BFA", fontSize: 16, marginTop: 16 },
});
