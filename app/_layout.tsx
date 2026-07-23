import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { socket, connectSocket } from "../src/shared/lib/socket-client";
import { useGuestAuth } from "../src/features/auth-guest/hooks/useGuestAuth";

function useProtectedRoute(hasNickname: boolean, loading: boolean) {
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "onboarding";

    if (!hasNickname && !inAuthGroup) {
      router.replace("/onboarding");
    } else if (hasNickname && inAuthGroup) {
      router.replace("/");
    }
  }, [hasNickname, segments, loading]);
}

export default function RootLayout() {
  const { nickname, loading, setNickname } = useGuestAuth();
  useProtectedRoute(nickname !== null, loading);

  useEffect(() => {
    connectSocket();
    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0A1A", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#7C4DFF" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: "#0F0A1A" },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
        <Stack.Screen name="create-room" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="join-room" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="lobby" options={{ animation: "slide_from_right", gestureEnabled: false }} />
        <Stack.Screen name="game" options={{ animation: "fade", gestureEnabled: false }} />
        <Stack.Screen name="results" options={{ animation: "slide_from_bottom", gestureEnabled: false }} />
      </Stack>
    </View>
  );
}
