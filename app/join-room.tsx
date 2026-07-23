import { View, Text, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState, useRef } from "react";
import { socket } from "../src/shared/lib/socket-client";
import { useGuestAuth } from "../src/features/auth-guest/hooks/useGuestAuth";
import { Button } from "../src/shared/components/Button";

export default function JoinRoomScreen() {
  const { nickname } = useGuestAuth();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    setError("");
    const newCode = [...code];
    const char = text.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-1);
    newCode[index] = char;
    setCode(newCode);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleJoin = () => {
    const roomCode = code.join("");
    if (roomCode.length !== 6 || !nickname) return;

    socket.emit("join_room", { roomCode, nickname }, (response: any) => {
      if (response.success) {
        router.push({ pathname: "/lobby", params: { roomCode, nickname } });
      } else {
        setError(response.error);
      }
    });
  };

  const isComplete = code.every((c) => c !== "") && !!nickname;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Unirse a Sala</Text>

      <Text style={styles.label}>Jugando como</Text>
      <View style={styles.nicknameBox}>
        <Text style={styles.nicknameText}>{nickname}</Text>
      </View>

      <Text style={styles.label}>Código de sala</Text>
      <View style={styles.codeRow}>
        {code.map((char, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            style={[styles.codeCell, char ? styles.codeCellFilled : null]}
            value={char}
            onChangeText={(text) => handleCodeChange(text, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            maxLength={1}
            autoCapitalize="characters"
            autoFocus={index === 0}
            selectTextOnFocus
          />
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        variant="primary"
        size="lg"
        style={[styles.fullWidth, !isComplete && styles.disabled]}
        onPress={handleJoin}
        disabled={!isComplete}
      >
        <Text style={styles.btnText}>Entrar</Text>
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
    gap: 10,
    marginBottom: 8,
  },
  codeCell: {
    width: 48,
    height: 60,
    backgroundColor: "#1E1B2E",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 26,
    fontWeight: "700",
    color: "#FFF",
    borderWidth: 2,
    borderColor: "#2D2B3E",
  },
  codeCellFilled: {
    borderColor: "#7C4DFF",
    backgroundColor: "#1A1530",
  },
  error: {
    color: "#FF6B6B",
    fontSize: 14,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  fullWidth: { width: "100%", marginBottom: 16 },
  disabled: { opacity: 0.4 },
  btnText: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  backLink: { color: "#A78BFA", fontSize: 16 },
});
