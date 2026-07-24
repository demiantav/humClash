# Guía de Estudio — HumClash

> Una guía para entender cada tecnología y carpeta del proyecto, escrita para alguien
> que nunca tocó React Native, Expo, ni WebRTC.

---

## 1. El stack en una frase

El proyecto es una **app mobile** (iOS y Android) hecha con **JavaScript/TypeScript**.
El frontend corre en el celular del usuario; el backend corre en un servidor y coordina
las partidas. Se comunican en tiempo real vía WebSockets. El audio viaja directo de
celular a celular vía WebRTC.

---

## 2. Tecnologías — qué es cada cosa y por qué la usamos

### 2.1 JavaScript / TypeScript

| Concepto | Explicación |
|---|---|
| **JavaScript** | Lenguaje de programación que corre en navegadores, servidores (Node.js) y ahora también en apps mobile (React Native). Es el único lenguaje que usamos en TODO el proyecto. |
| **TypeScript** | JavaScript pero con "tipos" — le decís al código "esta variable es un string", "esta función devuelve un número". El editor te avisa si te equivocás antes de ejecutar. Es como JavaScript con un corrector automático que evita bugs tontos. |
| **¿Por qué TypeScript?** | En un proyecto con sockets, timers sincronizados y estados complejos, equivocarse de tipo (pasar un `string` donde se espera un `number`) rompe todo. TypeScript lo atrapa antes. |

**Archivo donde se configura:** `tsconfig.json`

### 2.2 React Native

| Concepto | Explicación |
|---|---|
| **React** | Librería de JavaScript para construir interfaces de usuario. La idea central: definís componentes (botones, pantallas, textos) y React los dibuja en pantalla. Cuando cambian los datos, React actualiza solo lo que cambió. |
| **React Native** | Es React pero para apps mobile. En vez de dibujar HTML (como en la web), dibuja componentes nativos reales de Android e iOS. Un `<Text>` en tu código se convierte en un `TextView` de Android o un `UILabel` de iOS. |
| **JSX** | Sintaxis que mezcla JavaScript con "etiquetas tipo HTML". Ej: `<View><Text>Hola</Text></View>`. Se compila a llamadas de React Native. |
| **Componente** | Una función que devuelve UI. Ej: `function Boton() { return <Pressable>...</Pressable> }`. Los componentes se anidan: una pantalla contiene botones, textos, etc. |

### 2.3 Expo

| Concepto | Explicación |
|---|---|
| **Expo** | Es un "framework" sobre React Native. Te da herramientas pre-armadas para no configurar cosas dolorosas: compilar la app, acceder a la cámara/micrófono, manejar archivos, etc. |
| **Expo Router** | Navegación basada en archivos. Creás un archivo `game.tsx` en la carpeta `app/` y automáticamente existe la ruta `/game`. No tenés que configurar rutas manualmente. |
| **Expo Go vs Dev Client** | Expo Go es una app genérica que corre proyectos Expo sin compilar nada (útil para prototipado). Dev Client es una build personalizada que incluye módulos nativos que Expo Go no tiene (como Agora para audio). Nosotros usamos **Dev Client** porque Agora requiere código nativo. |
| **EAS (Expo Application Services)** | Servicio en la nube de Expo que compila la app por vos. Le mandás el código, ellos lo buildan para Android/iOS y te devuelven un APK/IPA. No necesitás tener Android Studio ni Xcode bien configurados. |
| **eas.json** | Configuración de builds de EAS. Define perfiles (development, preview, production), tipo de build (APK, AAB), y variables de entorno. |
| **app.json** | Archivo central de configuración de la app: nombre, ícono, permisos, bundle ID, plugins de Expo. Es como el manifiesto de la aplicación. |

**Archivos clave:**
- `app.json` — configuración de la app + plugins de Expo
- `eas.json` — configuración de builds en la nube
- `app/` — carpeta donde Expo Router busca las pantallas

### 2.4 Zustand (estado global)

| Concepto | Explicación |
|---|---|
| **Estado** | Los datos que cambian mientras el usuario usa la app: ¿en qué sala está? ¿cuál es su rol? ¿cuánto tiempo queda? |
| **Estado global** | Datos que necesitan compartirse entre varias pantallas. Ej: el código de la sala se crea en CreateRoom pero se muestra en Lobby. |
| **Zustand** | Librería para manejar estado global. Creás un "store" (almacén) y cualquier componente puede leerlo o modificarlo. Es mucho más simple que Redux (la alternativa más famosa). |
| **¿Por qué Zustand?** | Es liviano (1 KB), no requiere Providers ni boilerplate, y funciona perfecto con React Native. |

**Archivos:**
- `src/store/useRoomStore.ts` — estado de la sala (código, jugadores, ready)
- `src/store/useGameStore.ts` — estado del juego (fase, rol, timer, puntajes)

### 2.5 Node.js + Socket.io (backend)

| Concepto | Explicación |
|---|---|
| **Node.js** | Entorno que ejecuta JavaScript fuera del navegador, en un servidor. Es lo que corre nuestro backend. |
| **Backend** | El código que corre en un servidor, no en el celular. Maneja las salas, los turnos, los timers. Es la "fuente de verdad" del juego. |
| **Socket.io** | Librería para comunicación bidireccional en tiempo real entre servidor y clientes. Cuando algo pasa en el servidor (ej: un jugador se une), el servidor emite un evento y todos los clientes lo reciben al instante. |
| **Evento** | Un mensaje con nombre. Ej: `socket.emit("create_room", { nickname: "Demo" })` envía un evento desde el cliente. El servidor lo escucha con `socket.on("create_room", callback)`. |
| **WebSocket** | El protocolo de red subyacente. Socket.io lo usa internamente pero agrega funcionalidades: reconexión automática, salas, namespaces, etc. |
| **¿Por qué Socket.io y no HTTP?** | HTTP es request→response (el cliente pide, el servidor responde). Para un juego en tiempo real necesitamos que el servidor le hable al cliente sin que el cliente pregunte (ej: "se acabó el tiempo"). Socket.io permite eso. |

**Archivos clave:**
- `server/src/index.ts` — punto de entrada del servidor
- `server/src/rooms/` — lógica de salas (crear, unirse, abandonar)
- `server/src/game-logic/` — lógica del juego (turnos, timers, puntuación)
- `server/src/security/` — rate limiting (anti-abuso)
- `server/src/moderation/` — reportes y moderación
- `src/shared/lib/socket-client.ts` — cliente Socket.io en la app

### 2.6 Agora (audio en tiempo real)

| Concepto | Explicación |
|---|---|
| **WebRTC** | Tecnología para transmitir audio/video directamente entre navegadores/apps, sin pasar por un servidor central. Conexión P2P (peer-to-peer). |
| **Agora** | Servicio comercial que facilita WebRTC. Te da un SDK (kit de desarrollo) para React Native. Maneja la parte difícil: NAT traversal, codecs, calidad de red. |
| **Agora App ID** | Identificador de tu aplicación en Agora. Es público (la app lo necesita para conectarse). Pero NUNCA va en el código cliente directamente — lo pasamos como variable de entorno en el build de EAS. |
| **Token de Agora** | Contraseña temporal que autoriza a un usuario a entrar a un "canal" de audio. Se genera en **nuestro backend**, nunca en el cliente. El token determina si el usuario puede hablar (PUBLISHER) o solo escuchar (SUBSCRIBER). |
| **Rol PUBLISHER / SUBSCRIBER** | El hummer es PUBLISHER: transmite audio. El guesser es SUBSCRIBER: solo escucha. Esto se fuerza desde el servidor — el guesser no puede transmitir aunque quiera. |
| **Canal** | Una "sala de audio" en Agora. Coincide con el código de sala de nuestro juego. |

**Archivos:**
- `src/features/voice-stream/hooks/useAgora.ts` — hook para manejar Agora en la app
- `src/features/voice-stream/hooks/useAgora.web.ts` — versión "falsa" para web (no tiene micrófono)
- `server/src/rooms/` — generación de tokens de Agora (del lado del servidor)

### 2.7 React Native Reanimated (animaciones)

| Concepto | Explicación |
|---|---|
| **Reanimated** | Librería de animaciones para React Native. A diferencia de la API básica de React Native, Reanimated corre las animaciones en el **UI thread** (el hilo de renderizado nativo), no en el JS thread. |
| **UI thread vs JS thread** | La app tiene dos hilos: el JS thread ejecuta tu código JavaScript, el UI thread dibuja la interfaz. Si hacés animaciones en el JS thread y ese hilo está ocupado (ej: procesando un evento de Socket.io), la animación se traba. Reanimated corre en el UI thread → animaciones fluidas siempre. |
| **withSpring** | Función de Reanimated que anima un valor imitando un resorte físico. Ej: un botón que "rebota" al presionarlo. |
| **useSharedValue** | Variable que Reanimated puede animar sin pasar por el puente JS↔nativo. |
| **useAnimatedStyle** | Convierte shared values en estilos que se aplican en el UI thread. |

**Archivos:** `src/features/game-round/animations/`

### 2.8 Otras librerías

| Librería | Para qué sirve |
|---|---|
| **expo-haptics** | Vibraciones del celular. Feedback táctil en aciertos, errores, victorias. |
| **expo-clipboard** | Copiar texto al portapapeles (ej: copiar el código de sala). |
| **expo-status-bar** | Controlar la barra de estado del celular (hora, batería, señal). |
| **@react-native-async-storage/async-storage** | Guardar datos simples en el celular (ej: apodo del jugador, preferencias). |
| **babel-preset-expo** | Configuración de Babel (el compilador de JS moderno a JS compatible) para Expo. Lo necesitamos pero nunca lo tocamos directamente. |

---

## 3. Estructura de carpetas — Screaming Architecture

La arquitectura del proyecto se llama **"Screaming Architecture"** (arquitectura que
grita). La idea: la estructura de carpetas debe gritar QUÉ hace la app (un juego de
tararear/adivinar), no DE QUÉ está hecha (React, Expo, etc.).

Por eso agrupamos por **feature de juego**, no por tipo técnico.

```
humClash/
├── app/                     ← Expo Router: cada archivo = una pantalla/navegación
│   ├── _layout.tsx           # Layout raíz (proveedores, navegación)
│   ├── index.tsx             # Pantalla de inicio (Home)
│   ├── onboarding.tsx        # Onboarding / elegir apodo
│   ├── create-room.tsx       # Crear sala privada (código OTP)
│   ├── join-room.tsx         # Unirse a sala con código
│   ├── lobby.tsx             # Sala de espera antes de jugar
│   ├── game.tsx              # Pantalla principal del juego (ronda activa)
│   └── results.tsx           # Resultados finales post-partida
│
├── src/                      ← Toda la lógica y UI de la app
│   ├── features/             ← Features del juego (una carpeta por feature)
│   │   ├── auth-guest/       # Apodo temporal sin registro
│   │   ├── matchmaking/      # Crear/unirse a sala
│   │   ├── game-round/       # Bucle principal: hummer ↔ guesser
│   │   │   ├── components/   # Componentes visuales
│   │   │   ├── hooks/        # Lógica reutilizable (useTimer, etc.)
│   │   │   ├── animations/   # Animaciones Reanimated
│   │   │   └── socket-events.ts  # Eventos Socket.io de esta feature
│   │   ├── voice-stream/     # Integración Agora WebRTC
│   │   │   └── hooks/        # useAgora, useAgora.web
│   │   ├── moderation/       # Silenciar / reportar jugador
│   │   ├── scoring/          # Cálculo de puntajes
│   │   └── results/          # Pantalla de resultados
│   │
│   ├── shared/               ← Código compartido entre features
│   │   ├── components/       # UI genérica (botones, modales)
│   │   ├── lib/              # Clientes (socket, Agora), utilidades
│   │   │   ├── socket-client.ts   # Conexión Socket.io
│   │   │   └── timerSync.ts       # Sincronización de timer
│   │   └── types.ts          # Tipos de TypeScript compartidos
│   │
│   └── store/                ← Estado global (Zustand)
│       ├── useRoomStore.ts   # Estado de la sala
│       └── useGameStore.ts   # Estado del juego
│
├── server/                   ← Backend Node.js (corre aparte)
│   └── src/
│       ├── index.ts          # Punto de entrada del servidor
│       ├── rooms/            # Gestor de salas
│       ├── game-logic/       # Turnos, timers, puntuación, banco de canciones
│       ├── moderation/       # Registro de reportes
│       └── security/         # Rate limiting
│
├── assets/                   ← Imágenes, iconos, fuentes
├── app.json                  ← Configuración de Expo
├── eas.json                  ← Configuración de EAS Build
├── package.json              ← Dependencias y scripts del frontend
├── server/package.json       ← Dependencias y scripts del backend
├── tsconfig.json             ← Configuración de TypeScript
└── AGENTS.md / DECISIONS.md  ← Documentación del proyecto
```

### ¿Por qué esta estructura?

Regla simple: si no sabés dónde va un archivo, preguntate **"¿a qué parte del loop de
juego pertenece?"** — no "¿qué tipo de archivo es?".

- Todo lo relacionado con crear/unirse a salas → `matchmaking/`
- Todo lo del turno de tararear/adivinar → `game-round/`
- Todo lo de transmitir audio → `voice-stream/`
- Cosas que usan varias features → `shared/`

---

## 4. Cómo fluye la información

### 4.1 Flujo de una partida

```
[Home] → elegir apodo
    ↓
[CreateRoom] → servidor crea sala, devuelve código OTP
    ↓
[Lobby] → esperar rival (se une con código OTP)
    ↓
Ambos listos → servidor hace countdown (3, 2, 1...)
    ↓
[Game] Ronda 1: Hummer ve canción, tararea 20s
    ↓           Guesser ve 4 opciones, elige 1 en 15s
    ↓
[Game] Ronda 2: Roles invertidos
    ↓ ... 5 rondas ...
    ↓
[Results] → tabla de puntajes, opción de revancha
```

### 4.2 Quién es la "fuente de verdad"

```
Servidor (SIEMPRE dueño de):
  - En qué fase está el juego (lobby, countdown, playing, result, game_over)
  - Cuánto tiempo queda (el timer corre en el servidor)
  - Qué canción toca en cada ronda
  - Qué jugador es hummer/guesser
  - Puntajes y resultados

Cliente (solo muestra lo que el servidor le dice):
  - Recibe el estado vía eventos Socket.io
  - Actualiza su UI local
  - Ajusta su barra de timer con serverTimestamp (±200ms de tolerancia)
  - NUNCA decide por sí mismo el estado del juego
```

### 4.3 Ejemplo: flujo de un turno

```
1. Servidor emite: round_start { song, options, hummer, guesser, timeLeft }
2. Cliente Hummer: muestra canción, activa micrófono (Agora PUBLISHER)
3. Cliente Guesser: muestra 4 opciones, solo escucha (Agora SUBSCRIBER)
4. Servidor emite timer_sync cada 1s: { timeLeft, serverTimestamp }
5. Clientes: actualizan barra de tiempo con animación
6. Si guesser elige opción:
   guesser emite: submit_guess { songId }
   Servidor emite: guess_result { correct, score, correctSongId }
7. Si se acaba el tiempo sin respuesta:
   Servidor emite: round_timeout { correctSongId }
8. Servidor emite: round_result { scores, nextRound }
9. Volver a paso 1 con roles invertidos (o game_over si 5 rondas)
```

---

## 5. Conceptos clave explicados

### 5.1 Hook

Un hook es una función de React que "engancha" funcionalidad a un componente. Empiezan
con `use`. Ejemplos:

- `useState(valorInicial)` → crea una variable que React observa. Si cambia, re-renderiza.
- `useEffect(callback, dependencias)` → ejecuta código cuando algo cambia.
- `useAgora(channelName)` → nuestro hook custom que maneja la conexión de audio.

Regla: los hooks solo se pueden usar dentro de componentes React o dentro de otros hooks.

### 5.2 Socket.io — emit y on

```typescript
// CLIENTE → SERVIDOR (el cliente pide algo)
socket.emit("create_room", { nickname: "Pepe" });

// SERVIDOR → CLIENTE (el servidor notifica algo)
socket.on("room_created", (data) => {
  console.log(data.code); // "A7X2K9"
});

// SERVIDOR → TODOS en la sala
io.to(roomCode).emit("player_joined", { player });
```

### 5.3 Estado global con Zustand

```typescript
// Crear store (en src/store/useRoomStore.ts)
const useRoomStore = create((set) => ({
  roomCode: "",
  setRoomCode: (code) => set({ roomCode: code }),
}));

// Usarlo en cualquier componente
function LobbyScreen() {
  const roomCode = useRoomStore((s) => s.roomCode);
  return <Text>Sala: {roomCode}</Text>;
}
```

### 5.4 timerSync — por qué no usamos setInterval

El timer NO corre en el celular con `setInterval`. Corre en el servidor. El servidor
envía `timer_sync` con el tiempo restante y un timestamp. El cliente ajusta su barra
visual basándose en ese timestamp, compensando la latencia de red.

Si usáramos `setInterval` local, con mala conexión el timer del celular se
desincronizaría del servidor. Un jugador vería 5s restantes mientras el servidor ya
terminó la ronda.

### 5.5 Módulos nativos

Son librerías que incluyen código en Java/Kotlin (Android) y Swift/Objective-C (iOS).
React Native no puede "simularlas" con JavaScript — necesitan compilarse junto con la app.

Ejemplos en este proyecto:
- `react-native-agora` → acceso al micrófono y transmisión de audio
- `expo-haptics` → vibración del dispositivo
- `react-native-reanimated` → animaciones en el UI thread nativo

Por eso usamos Expo Dev Client en vez de Expo Go: Go no incluye módulos nativos
personalizados.

---

## 6. Ruta de aprendizaje recomendada

Si nunca tocaste estas tecnologías, este orden te va a servir:

### Semana 1 — JavaScript moderno
1. Sintaxis ES6+: arrow functions `() => {}`, destructuring `{ a, b } = obj`, template strings
2. Async/await y Promesas
3. Módulos: `import` / `export`

### Semana 2 — TypeScript básico
1. Tipos básicos: `string`, `number`, `boolean`, `Array<T>`
2. Interfaces y tipos personalizados
3. Union types, optional properties

### Semana 3 — React
1. Componentes funcionales y JSX
2. Props (datos que un componente recibe de su padre)
3. useState y useEffect
4. Manejo de eventos (onPress, onChange)

### Semana 4 — React Native + Expo
1. Componentes core: View, Text, Pressable, TextInput, FlatList
2. Navegación con Expo Router (file-based routing)
3. Estilos con StyleSheet (similar a CSS pero en JS)
4. Ejecutar en simulador y en dispositivo real

### Semana 5 — Estado global + Sockets
1. Zustand: crear stores, leer y modificar estado
2. Socket.io: concepto de eventos, emit y on
3. Conectar frontend con backend en tiempo real

### Semana 6 — Conceptos específicos del proyecto
1. Leer `AGENTS.md` y `DECISIONS.md`
2. Seguir el flujo del juego en el código (Home → CreateRoom → Lobby → Game → Results)
3. Entender cómo el servidor controla el estado y el cliente solo muestra
4. Reanimated: withSpring, useSharedValue, useAnimatedStyle
5. Agora: concepto de canales, tokens, PUBLISHER/SUBSCRIBER

### Recursos gratuitos recomendados
- **JavaScript moderno:** javascript.info (en español)
- **React:** react.dev (tutorial oficial, tiene versión en español)
- **React Native:** reactnative.dev/docs/getting-started
- **Expo:** docs.expo.dev (muy buena documentación)
- **TypeScript:** typescriptlang.org/docs/handbook (oficial)
- **Socket.io:** socket.io/docs/v4/ (tutorial básico es suficiente)
- **Zustand:** github.com/pmndrs/zustand (README es toda la doc que necesitás)

---

## 7. Comandos del día a día

```bash
# Desarrollo local
npm run server          # Levanta el backend (puerto 3001)
npm run web             # Cliente web (navegador)
npx expo start --dev-client  # Servidor de desarrollo para el APK

# Build para Android
npx eas build --platform android --profile development
npx eas build --platform android --profile development --clear-cache

# Tests del backend
cd server && npm test

# TypeScript check (frontend)
npm run lint

# Instalar dependencias después de cambiar package.json
npm install             # En la raíz (frontend)
cd server && npm install  # En server/ (backend)

# Git
git checkout develop
git pull
git checkout -b feature/nombre-feature
# ... trabajar ...
git add .
git commit -m "feat(scope): descripcion"
git push -u origin feature/nombre-feature
```

---

## 8. Glosario rápido

| Término | Significado |
|---|---|
| **APK** | Archivo instalable de Android (como un .exe pero para Android) |
| **IPA** | Archivo instalable de iOS |
| **Build** | Compilar el código fuente en un APK/IPA ejecutable |
| **Bundle** | Empaquetar todo el JavaScript en un archivo que la app carga |
| **Metro** | El "bundler" de React Native — junta todo tu JS en un bundle |
| **Hot Reload** | Los cambios en el código se reflejan en la app sin reinstalar |
| **Hermes** | Motor de JS optimizado para Android (más rápido y menos memoria) |
| **JSI** | JavaScript Interface — capa de comunicación entre JS y código nativo |
| **Fabric** | El nuevo renderizador de React Native (New Architecture) |
| **Turbo Module** | Nueva forma de cargar módulos nativos (más rápida que la vieja) |
| **Bridge** | El "puente" viejo entre JS y nativo (asincrónico, lento). La New Architecture lo reemplaza. |
| **OTP** | One-Time Password — el código de 6 dígitos para unirse a una sala |
| **P2P** | Peer-to-Peer — conexión directa entre dos dispositivos sin servidor intermedio |
| **NAT traversal** | Técnica para conectar dos dispositivos que están detrás de routers diferentes |
