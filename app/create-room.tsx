import { View, Text, StyleSheet, Pressable, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import { socket } from "../src/shared/lib/socket-client";
import * as Clipboard from "expo-clipboard";

export default function CreateRoomScreen() {
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [created, setCreated] = useState(false);

  const handleCreate = () => {
    if (!nickname.trim()) return;
    socket.emit("create_room", { nickname: nickname.trim() }, (response: any) => {
      if (response.success) {
        setRoomCode(response.roomCode);
        setCreated(true);
      } else {
        Alert.alert("Error", response.error);
      }
    });
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(roomCode);
    Alert.alert("¡Copiado!", "Compartí el código con tu amigo");
  };

  const handleStart = () => {
    router.push({
      pathname: "/lobby",
      params: { roomCode, nickname: nickname.trim() },
    });
  };

  if (created) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Sala Creada</Text>
        <Text style={styles.code}>{roomCode}</Text>
        <Pressable style={styles.button} onPress={handleCopy}>
          <Text style={styles.buttonText}>Copiar Código</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.buttonSecondary]} onPress={handleStart}>
          <Text style={[styles.buttonText, styles.buttonSecondaryText]}>Entrar al Lobby</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Crear Sala</Text>
      <Text style={styles.label}>Tu apodo</Text>
      <TextInput
        style={styles.input}
        placeholder="Ingresá tu apodo"
        placeholderTextColor="#666"
        value={nickname}
        onChangeText={setNickname}
        maxLength={15}
        autoFocus
      />
      <Pressable
        style={[styles.button, !nickname.trim() && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={!nickname.trim()}
      >
        <Text style={styles.buttonText}>Crear</Text>
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
  code: {
    fontSize: 48,
    fontWeight: "900",
    color: "#00D4AA",
    letterSpacing: 8,
    marginBottom: 32,
  },
  button: {
    width: "100%",
    backgroundColor: "#7C4DFF",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#7C4DFF",
  },
  buttonDisabled: {
    opacity: 0.5,
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
