import { View, Text, StyleSheet, Pressable, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState, useRef } from "react";
import { socket } from "../src/shared/lib/socket-client";

export default function JoinRoomScreen() {
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text.toUpperCase().slice(0, 1);
    setCode(newCode);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleJoin = () => {
    const roomCode = code.join("");
    if (roomCode.length !== 6 || !nickname.trim()) return;

    socket.emit("join_room", { roomCode, nickname: nickname.trim() }, (response: any) => {
      if (response.success) {
        router.push({
          pathname: "/lobby",
          params: { roomCode, nickname: nickname.trim() },
        });
      } else {
        Alert.alert("Error", response.error);
      }
    });
  };

  const isComplete = code.every((c) => c !== "") && nickname.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Unirse a Sala</Text>

      <Text style={styles.label}>Tu apodo</Text>
      <TextInput
        style={styles.input}
        placeholder="Ingresá tu apodo"
        placeholderTextColor="#666"
        value={nickname}
        onChangeText={setNickname}
        maxLength={15}
      />

      <Text style={styles.label}>Código de sala</Text>
      <View style={styles.codeRow}>
        {code.map((char, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            style={styles.codeCell}
            value={char}
            onChangeText={(text) => handleCodeChange(text, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            maxLength={1}
            autoCapitalize="characters"
            autoFocus={index === 0}
          />
        ))}
      </View>

      <Pressable
        style={[styles.button, !isComplete && styles.buttonDisabled]}
        onPress={handleJoin}
        disabled={!isComplete}
      >
        <Text style={styles.buttonText}>Entrar</Text>
      </Pressable>

      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>Volver</Text>
      </Pressable>
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
    fontSize: 16,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  input: {
    width: "100%",
    backgroundColor: "#1E1B2E",
    color: "#FFF",
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#2D2B3E",
  },
  codeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 32,
  },
  codeCell: {
    width: 48,
    height: 56,
    backgroundColor: "#1E1B2E",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF",
    borderWidth: 1,
    borderColor: "#2D2B3E",
  },
  button: {
    width: "100%",
    backgroundColor: "#7C4DFF",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
  },
  backLink: {
    color: "#A78BFA",
    fontSize: 16,
  },
});
