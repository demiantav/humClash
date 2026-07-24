import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useGuestAuth } from "../src/features/auth-guest/hooks/useGuestAuth";
import { Button } from "../src/shared/components/Button";

export default function OnboardingScreen() {
  const { setNickname } = useGuestAuth();
  const [name, setName] = useState("");
  const [step, setStep] = useState(0);

  const handleNext = async () => {
    if (step === 0 && name.trim().length >= 2) {
      setStep(1);
    } else if (step === 1) {
      await setNickname(name.trim());
    }
  };

  if (step === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>¿Cómo se juega?</Text>

        <View style={styles.instructions}>
          <View style={styles.instructionCard}>
            <Text style={styles.emoji}>🎤</Text>
            <Text style={styles.instructionTitle}>Tarareá</Text>
            <Text style={styles.instructionText}>
              Te mostramos una canción. Vos la tarareás con tu voz.
            </Text>
          </View>
          <View style={styles.instructionCard}>
            <Text style={styles.emoji}>👂</Text>
            <Text style={styles.instructionTitle}>Adiviná</Text>
            <Text style={styles.instructionText}>
              Escuchá a tu rival y elegí entre 4 opciones.
            </Text>
          </View>
          <View style={styles.instructionCard}>
            <Text style={styles.emoji}>🏆</Text>
            <Text style={styles.instructionTitle}>Ganá</Text>
            <Text style={styles.instructionText}>
              5 rondas. El que adivina más rápido suma más puntos.
            </Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>
          No grabamos tu voz ni almacenamos audio de tus partidas. El audio es directo
          entre jugadores.
        </Text>

        <Button variant="primary" size="lg" style={styles.fullWidth} onPress={handleNext}>
          <Text style={styles.buttonText}>Entendido, ¡a jugar!</Text>
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>HumClash</Text>
      <Text style={styles.subtitle}>
        Tarareá canciones contra tus amigos en tiempo real
      </Text>

      <View style={styles.inputSection}>
        <Text style={styles.label}>Elegí tu apodo</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingresá un apodo"
          placeholderTextColor="#555"
          value={name}
          onChangeText={setName}
          maxLength={15}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleNext}
        />
        <Text style={styles.hint}>De 2 a 15 caracteres. Sin registro, sin contraseña.</Text>
      </View>

      <Button
        variant="primary"
        size="lg"
        style={[styles.fullWidth, name.trim().length < 2 && styles.disabled]}
        onPress={handleNext}
        disabled={name.trim().length < 2}
      >
        <Text style={styles.buttonText}>Empezar</Text>
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
  logo: {
    fontSize: 48,
    fontWeight: "900",
    color: "#FFD700",
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#A78BFA",
    textAlign: "center",
    marginBottom: 48,
    lineHeight: 22,
  },
  inputSection: {
    width: "100%",
    marginBottom: 32,
  },
  label: {
    color: "#A78BFA",
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    width: "100%",
    backgroundColor: "#1E1B2E",
    color: "#FFF",
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    borderWidth: 1,
    borderColor: "#7C4DFF",
    marginBottom: 8,
  },
  hint: {
    color: "#666",
    fontSize: 12,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFD700",
    marginBottom: 32,
  },
  instructions: {
    width: "100%",
    gap: 16,
    marginBottom: 32,
  },
  instructionCard: {
    backgroundColor: "#1E1B2E",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2D2B3E",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  emoji: {
    fontSize: 36,
  },
  instructionTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  instructionText: {
    color: "#888",
    fontSize: 13,
    flex: 1,
    flexWrap: "wrap",
  },
  disclaimer: {
    color: "#555",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 18,
  },
});
