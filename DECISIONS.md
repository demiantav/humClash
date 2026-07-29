# DECISIONS.md — Bitácora del proyecto HUM & GUESS 1v1

Esto reemplaza la memoria que OpenCode no tiene entre sesiones. Se actualiza al final
de cada sesión de trabajo significativa. Formato: fecha, decisión/estado, motivo.

Al abrir una sesión nueva: leer este archivo + `AGENTS.md` antes de tocar código.

---

## 2026-07-23 — Kickoff del proyecto

**Decidido:**

- Concepto: juego 1v1 de tararear/adivinar en tiempo real. Diferencial frente a
  competidores (SongPop, Guessong, Mukiz) es que el audio lo genera el jugador tarareando,
  no se reproduce audio grabado — evita costo/riesgo de licencias musicales.
- Stack: React Native + Expo, Node.js + Socket.io, LiveKit/Agora para voz (WebRTC).
- Arquitectura: Screaming Architecture agrupada por feature de juego, no por tipo técnico.
- Git: `main` / `develop` / `feature/*` / `fix/*` / `hotfix/*`, Conventional Commits.
- Público objetivo: Fase 1 LatAm/hispanohablante (validación, bajo costo de adquisición,
  banco de canciones local), Fase 2 USA/Europa (escala, requiere más pulido de UX,
  banco de canciones localizado). No pasar a Fase 2 sin retención confirmada en Fase 1.
- Monetización: publicitaria (ads) en el MVP, sin IAP agresivo. IAP de paquetes temáticos
  evaluado recién en Fase 2.
- Matchmaking: priorizar salas privadas por código sobre matchmaking aleatorio en el MVP,
  por baja base de usuarios inicial.
- Dirección de diseño: motion design estilo arcade (Crazy Taxi/Sonic) — paleta saturada,
  squash & stretch, screen shake, combo counter con Rive (state machines, no Lottie),
  confetti en victoria, haptics sincronizados.
- Moderación (reportar/silenciar) obligatoria desde el MVP por ser voz en vivo entre
  desconocidos.
- Modelos de IA (OpenCode Go, sin Claude): DeepSeek V4 Pro/GLM-5.2 como principal, DeepSeek
  V4 Flash/Qwen3.6 Plus como worker económico.

**Pendiente (alta prioridad):**

- Definir costo real por partida de transmisión de voz (Agora/LiveKit cobran por minuto)
  antes de proyectar escalado de usuarios.
- Confirmar cobertura/latencia real de LiveKit/Agora en los países específicos de
  lanzamiento de Fase 1 (no asumir cobertura pareja en toda Sudamérica).
- Armar banco base de 50 canciones para Fase 1 con mezcla real: reggaetón, rock en
  español, cumbia, clásicos latinos.
- Diseñar sistema de reporte/silenciamiento de jugadores (moderación) antes de cualquier
  prueba con usuarios reales.

**Sin decidir todavía:**

- Definir explícitamente el diseño técnico del combo counter (qué variables expone la
  state machine de Rive: racha actual, velocidad de respuesta, etc.)
- Proveedor final entre LiveKit vs Agora (pendiente de comparar costo real por minuto).
- Estrategia de marketing concreta para Fase 1 más allá de "TikTok es el canal natural".

---

## 2026-07-23 — Plan de MVP completo (sesión 2)

**Decidido (resuelve pendientes de la sesión anterior):**

- Nombre definitivo: **HumClash** (el repo ya lo refleja).
- Audio: proveedor confirmado **Agora** sobre LiveKit. SDK más maduro para React
  Native, pricing más simple, buen soporte documental. Tokens generados por el backend
  (App ID nunca sale del servidor). Solo el hummer transmite audio — controlado
  server-side vía token con `role: PUBLISHER/SUBSCRIBER`.
- Animaciones: **React Native Reanimated** para todo el MVP. Rive queda post-MVP
  cuando haya un `.riv` con state machines diseñado por un motion designer.
- Banco de canciones: reducido de 50 a **30 canciones** para el MVP (10 fáciles,
  12 medias, 8 difíciles). Cada canción tiene `hint` textual obligatorio.
- Base de datos: **NINGUNA en el MVP**. Todo en memoria del servidor. Las salas,
  turnos, puntajes y reportes viven durante la sesión y mueren al terminar.
- Hosting del backend: **Render** (free tier para MVP).
- Rondas por partida: **5 fijas** (roles se invierten cada ronda). 20s para
  tararear, 15s para adivinar.
- iOS + Android: **ambos desde el día 0**, no Android-first.

**Agregado al plan (gaps identificados):**

- **Performance:** medición de FPS en gama baja Android (Snapdragon 600/700, 3-4GB RAM),
  timer server-authoritative con `serverTimestamp` para evitar desync por latencia,
  tolerancia máxima ±200ms.
- **Seguridad:** rate limiting por IP en Socket.io (creación, join, reportes),
  Agora App ID nunca en cliente (token generado server-side), control server-side de
  quién transmite (no depende del cliente), sin cloud recording ni almacenamiento de
  audio.
- **UX pre-lanzamiento:** pantalla de espera interactiva en lobby (logo animado +
  carrusel de instrucciones), cuenta regresiva 3-2-1 con mensaje "¡No hay vergüenza!",
  hint textual a los 10s para el guesser, botón "Tarareá de nuevo" (1 vez/ronda),
  indicador de progreso de partida (5 dots), cambio de rol dramático (slam + cambio
  de color de fondo azul/naranja), audio indicator de "tu rival te escucha".
- **UX post-partida:** revancha con narrativa competitiva ("Perdiste la primera, ¿vas
  a dejar que gane la serie?"), dato positivo siempre para el perdedor, confetti en
  victoria.
- **Timer intenso:** últimos 3 segundos con barra parpadeante roja, número en escala
  up, haptics heartbeat.
- **Accesibilidad:** contraste WCAG AA en todos los textos, touch targets ≥ 48x48dp,
  feedback multicanal (visual + háptico + sonido), no depender solo de color.
- **Moderación detallada:** botón silenciar (local, no notifica al rival), botón
  reportar (modal con motivos, backend registra en array, sin acción automática MVP).
- **Micro-interacciones:** TODO botón tiene scale-down (`withSpring` a 0.95) + haptic
  light + sonido pop. Sin excepciones.
- **Edge cases:** manejo de desconexión con timer de gracia de 15s para reconexión,
  doble tap ignorado (debounce 500ms), sala limpia tras 5 min de inactividad,
  app en background sincroniza timer al volver.

**Plan de fases (12-14 semanas, ~87 archivos):**

| Fase | Días | Descripción |
|---|---|---|
| 0 — Setup | 3-4 | Proyecto Expo + backend Node.js/Socket.io |
| 1 — Backend Core | 4-5 | Salas, turnos, timers, rate limiting, Agora tokens |
| 2 — Matchmaking | 3-4 | Crear/unirse a sala, código OTP, lobby interactivo |
| 3 — Game Loop | 5-6 | Vistas Hummer/Guesser, timer, opciones, combo counter |
| 4 — Agora WebRTC | 4-5 | Audio P2P, control de transmisión, audio indicator |
| 5 — Resultados | 2-3 | Confetti, tabla de puntajes, revancha con narrativa |
| 6 — Animaciones | 4-5 | Screen shake, combo counter, transiciones, sonidos, accesibilidad |
| 7 — Onboarding & Moderación | 3-4 | Onboarding, MuteButton, ReportButton, desconexión |
| 8 — Testing & Deploy | 4-5 | Tests en dispositivos reales, build APK, deploy backend |

**Pendiente (sin cambios, sigue vigente):**

- Definir costo real por partida de Agora midiendo minutos reales en partidas de
  prueba (no asumir los 3.3 min teóricos).
- Confirmar cobertura/latencia real de Agora en ≥ 3 países de LatAm durante Fase 8.
- Diseñar estrategia de marketing concreta para Fase 1 (TikTok como canal natural,
  pero falta plan de contenido y micro-influencers).
- Diseñar ícono + splash screen del juego.

**Acciones inmediatas (esta semana):**

1. Crear cuenta en Agora Console (gratis, 10.000 minutos/mes).
2. Crear cuenta en Render y conectar repo de GitHub.
3. Registrar Apple Developer Program ($99/año) para poder buildear iOS.
4. Diseñar ícono + splash screen básicos.
5. Validar las 30 canciones con 2-3 amigos hispanohablantes.
6. Elegir assets de sonido (Mixkit o similar, libres de royalty).

---

## 2026-07-23 — Fase 0 + Fase 1 completadas

**Fase 0 — Setup:**
- Proyecto Expo (SDK 57, TypeScript 6) con Expo Router, Zustand, Reanimated 4.5.
- Backend Node.js + Socket.io con RoomManager, SongBank (30 canciones), Scoring, Rate Limiter.
- 47 archivos en estructura Screaming Architecture.
- 6 pantallas base: Home, CreateRoom (código OTP 6 celdas), JoinRoom, Lobby, Game, Results.
- 2 stores Zustand: useRoomStore, useGameStore.
- Socket.io cliente + servidor verificados con ping/pong.

**Fase 1 — Backend Core:**
- GameSession.ts: state machine (lobby → countdown → round_active → round_result → loop 5x → game_over).
- TurnManager.ts: timers con serverTimestamp en timer_sync para sync cliente (±200ms).
- Rondas con fase hummer (20s) + guesser (15s). Hummer ve canción, guesser ve 4 opciones.
- Eventos: countdown_tick (3,2,1,0), start_humming, request_rehum, humming_started.
- Auto-start: ambos ready en lobby → game_starting automático con countdown.
- Revancha: request_rematch × 2 → rematch_accepted → nuevo game_starting.
- Rate limiter arreglado (bug: mezclaba timestamps de todos los eventos).
- 32/32 tests de integración pasando (npm run test).
- Edge case pendiente: player_disconnected durante countdown (Fase 7).

**Branch:** feature/kickoff-setup.

---

## 2026-07-24 — Git flow: cuándo cerrar una rama

**Decidido:**

El agente (OpenCode) avisará proactivamente cuándo es momento de cerrar una rama feature
en lugar de acumular commits indefinidamente. Criterios para sugerir merge + delete +
nueva rama:

- **Se completó una feature lógica** (ej. "integración Agora", "pantalla de resultados").
  No esperar a tener 10 features en una misma rama.
- **Se acumularon 5+ commits** en la rama actual sin mergear a `develop`. Revisar si
  conviene cerrar antes de seguir.
- **Cambio de foco** (ej. pasamos de frontend a backend, o de una feature a otra no
  relacionada). Rama nueva = contexto limpio.
- **Antes de empezar una fase nueva del plan** (Fase 2, Fase 3, etc.), mergear la rama
  actual a `develop` y crear una nueva desde `develop`.

**Flujo estándar que ejecuta el agente:**

1. `git checkout develop && git merge <feature> --no-edit`
2. `git branch -d <feature>` (local)
3. `git push origin --delete <feature>` (remote)
4. `git checkout -b feature/<nueva-feature>` desde `develop`

El agente **no** mergea directo a `main` — eso se hace vía PR desde `develop` cuando
haya versión estable para deploy.

**Branch actual:** feature/matchmaking-salidas-ui (Fase 2).

---

## 2026-07-25 — Fix masivo de bugs de audio y timer

**Branch:** `feature/matchmaking-salidas-ui` (7 commits nuevos).

**Avances de la sesión:**

- **Fix del bug de navegación:** `useGuestAuth` usaba `useState` local en cada componente →
  el layout y el onboarding no compartían el estado del apodo. Solución: migrar a Zustand
  store (`src/store/useAuthStore.ts`). Loop "elegir apodo → cómo se juega → elegir apodo"
  resuelto.
- **Fix del timer:** `timeLimit` y `serverTimestamp` no estaban en el store de Zustand.
  El `TimerBar` recibía `game.timeLeft` como `secondsElapsed` y `Date.now()` como
  `serverTimestamp` (cliente, no servidor). Solución: agregar `timeLimit` y
  `serverTimestamp` a `useGameStore`, pasar valores correctos desde `timer_sync`.
- **Auditoría completa de audio (21 bugs encontrados, 14 arreglados):**
  - **P0 (audio):** credenciales de Agora configuradas en `.env` y `server/.env`,
    orden de eventos `new_round` antes que `agora_token` para evitar stale closure,
    handler duplicado `request_agora_token` eliminado, mute determinado por `data.role`.
  - **P1 (timer/roles):** `setTimeLimit` en `onNewRound`, `CountdownOverlay` sincronizado
    con `countdown_tick` del servidor, `setClientRole()` sin destruir engine en cambio
    de rol, uid por índice de jugador, `isAudioActive = isJoined`.
  - **P2 (UX):** `startTimer` movido a `startGuessing()`, timeLimit consistente,
    `MuteButton` conectado a `muteRemoteAudioStream`, handler de `humming_started`.
- **EAS builds:** problema de `typescript@5.9.3` en lock file — npm 11 no lo trackea
  como npm 10. Solución: regenerar lock file con npm 10.
- **`expo-av` eliminado temporalmente** por incompatibilidad binaria con RN 0.86 (JSI
  symbol mismatch en `libexpo-av.so`). Se re-agrega en Fase 6 cuando Expo lo arregle.
- **Guía de estudio:** creado `GUIA_DE_ESTUDIO.md` con explicación de cada tecnología,
  estructura de carpetas, flujo de datos, ruta de aprendizaje y glosario.
- **`server/.expo` fantasmal:** al ejecutar `npx expo start` desde `server/` se creó
  una carpeta `.expo` que Metro usaba como raíz del proyecto. Borrada con `rm -rf`.

**Próxima sesión:**
1. Verificar que `npm run server` levanta con credenciales de Agora.
2. Testear partida completa con audio: emulador + celu físico.
3. Mergear `feature/matchmaking-salidas-ui` a `develop` (7 commits acumulados).
4. Crear nueva rama `feature/results-screen` para Fase 5 — Resultados.
5. Fase 5: pantalla de resultados con confetti Reanimated, tabla de puntajes, revancha.

**Branch:** `feature/matchmaking-salidas-ui`.


**Avances de la sesión:**

- Configuración completa de **EAS Build** para Android:
  - `expo-dev-client` ya instalado en el proyecto.
  - Instalación de `eas-cli` como devDependency.
  - Login en Expo (`deeem06`), proyecto creado en EAS: `@deeem06/humclash`.
  - `eas.json` creado con profile `development` (APK, developmentClient).
  - `owner: "deeem06"` agregado a `app.json` para resolver múltiples cuentas.
- **2 bugs encontrados y resueltos durante el build:**
  1. `package-lock.json` corrupto/desincronizado (no contenía `typescript@5.9.3` requerido por eas-cli). Solución: `rm -rf node_modules package-lock.json && npm install`.
  2. Error `EUSAGE: typescript@5.9.3 missing from lock file` en EAS resuelto al regenerar el lock file desde cero.
- **Build #3 en curso:** `97351290-d544-40df-86a5-1f25d269c386` — pasó `npm ci` y entró en compilación Gradle.
- **Secrets de EAS seteados:**
  - `EXPO_PUBLIC_AGORA_APP_ID` (App ID de Agora Console).
  - `EXPO_PUBLIC_SERVER_URL` (IP local para conectar celu ↔ backend).
- **Stub web creado:** `useAgora.web.ts` — retorna estado inerte, permite compilar la app en web sin módulo nativo de Agora.
- **Fix MuteButton:** import de socket de `require()` dinámico a import estático (`src/features/moderation/components/MuteButton.tsx:6`).
- **Remoción de GestureHandlerRootView** en `app/_layout.tsx` — no está en uso, pero si en el futuro se necesita react-native-gesture-handler, restaurar.
- `feature/kickoff-setup` mergeada a `develop` y eliminada (local). Remote pendiente: GitHub tiene `feature/kickoff-setup` como default branch, hay que cambiarlo a `develop` manualmente.
- Nueva rama `feature/matchmaking-salidas-ui` creada desde `develop` (2 commits chore de lock file).

**Estado de fases del plan (actualizado):**

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Setup | ✅ |
| 1 | Backend Core | ✅ |
| 2 | Matchmaking | ✅ |
| 3 | Game Loop | ✅ |
| 4 | Agora WebRTC | ✅ |
| 5 | Resultados | ❌ Placeholder |
| 6 | Animaciones & Sonidos | 🟡 Parcial (falta expo-av, confetti, transiciones) |
| 7 | Onboarding & Moderación | 🟡 Parcial (falta report modal, edge cases) |
| 8 | Testing & Deploy | 🔄 Build #3 en curso |

**Acciones inmediatas próxima sesión:**
1. Verificar que build #3 de EAS terminó OK.
2. Instalar APK en dispositivo Android, correr backend local (`npm run server`).
3. Probar partida completa: create → join → lobby → ready → countdown → 5 rondas → game_over → rematch.

**Próxima feature a implementar: Fase 5 — Resultados.**
- Pantalla de resultados con confetti animado (Reanimated).
- Tabla de puntajes por ronda.
- Revancha con narrativa competitiva.
- Navegación desde `game.tsx` → `results.tsx` ya existe (placeholder).

---

## 2026-07-27 — Fase 5 Resultados implementada + fixes Agora commiteados

**Branch:** `feature/results-screen` (mergeada a `develop` el 2026-07-29).

**Cierre de rama anterior:**
- Commiteados los fixes de audio Agora que estaban sin commitear en
  `feature/matchmaking-salidas-ui` (uid+1, profile LiveBroadcasting, permiso
  RECORD_AUDIO, renewToken sin destruir engine, logs RC). Mergeado a `develop`
  y rama vieja borrada (local + remoto).
- ⚠️ **Pendiente validar audio en dispositivo real** (siguiente sesión con APK
  + backend local). El commit entra como fix pendiente de verificación visual.

**Refactor de datos (prerrequisito de Fase 5):**
- `gameOver` y `rematchRequestedByRival` migrados de `useState` local de
  `useGameRound` al store Zustand (`useGameStore`). Antes se perdía la data
  de toda la partida al desmontar `game.tsx` → imposible pintar tabla de
  resultados aunque quisieras.
- `GameOverData` + `GameOverRound` movidos a `src/shared/types.ts` para romper
  el ciclo de imports entre store y socket-events.
- `game.tsx` navega a `/results` sin `winnerId/winnerName` (ya en el store).

**Fase 5 — Implementación (commit `80ba66b`):**
- `Confetti.tsx`: 36 partículas Reanimated (spring + timing + delay random),
  se dibuja solo si `outcome === "win"`. paleta saturada.
- `WinnerBanner.tsx`: título chunky con `useResultEntrance` (slam/zoom spring),
  fondo por outcome (verde/dorado si gané, rojo si perdí, púrpura si empate).
- `RoundScoreTable.tsx`: 5 filas (canción, acierto ✓/✕, timeTaken, score).
  Fila del jugador resaltada vs rival. Zebra.
- `RematchButton.tsx`: squash & stretch al press + haptic light + estados
  idle/sent/accepted. Spinner en "esperando".
- `SecondaryButton.tsx`: "Volver al inicio" reutilizable.
- `RematchIncomingSheet.tsx`: **bottom-sheet** (decisión UX) cuando el rival
  pide revancha primero. Narrativa competitiva "Perdiste la primera, ¿vas a
  dejar que gane la serie?". Botón aceptar con haptic Medium.
- `useRematch.ts`: hook que escucha `rematch_requested`/`rematch_accepted`,
  expone `requestRematch`/`acceptRematch`/`declineRematch`. Navega a `/game`
  en accepted tras `resetGame()`.
- `app/results.tsx`: layout vertical (banner → narrativa → tabla → acciones),
  confetti overlay en victoria, haptics Success/Error al montar + screen shake,
  botón Volver → `leave_room` + `resetGame` + `router.replace("/")`.
- Narrativa derivada de `gameOver.rounds`: fast hits (<3s) en derrota →
  "Adivinaste X en menos de 3 segundos"; hits normales → fallback; empate →
  "Serie empatada — ¿desempate?".

**Decisiones tomadas en esta sesión:**

1. **Identidad "yo" vía `nickname`** (no `playerId`). El cliente no conoce su
   `playerId` en el store; comparar `nickname` contra `winner.nickname` y
   `scores[i].nickname`. **Colisión de apodos queda fuera del MVP** —
   irrelevante con salas privadas entre amigos. Revisar si mueve a
   matchmaking aleatorio (Fase 1 escalada).
2. **Modal/bottom-sheet para revancha entrante** (decisión UX vs botón inline
   o auto-aceptar). Más dramático, más código — justificado por el énfasis
   competitivo del diseño.
3. **"Volver al inicio" → `leave_room` + `resetGame` + `router.replace("/")`**.
   Cierra socket y limpia estado. No depende del timer de inactividad del
   server (5min).

**Limitaciones conocidas (aceptadas para MVP):**

- **Echo `rematch_requested` al iniciador.** Cuando jugador A pide revancha y
  B acepta emitiendo `accept_rematch`, el server trata eso como otro
  `requestRematch` → emite `rematch_requested` a A también. Resultado: A ve
  el bottom-sheet flashear brevemente entre `rematch_requested` y
  `rematch_accepted` (que llega enseguida y limpia el flag). No rompe
  navegación. Si molesta en device, mitigar ignorando `rematch_requested`
  cuando `status === "sent"` en el store (futuro fix menor).
- **Rechazar revancha no avisa al rival.** `declineRematch` solo limpia
  flag local. El rival que pidió queda esperando. Post-MVP: agregar
  `decline_rematch` server-side + emitir `rematch_declined` al iniciador.
- **`expo-av` sigue fuera** (incompatibilidad binaria RN 0.86). Los sonidos
  de victoria/pop quedan pendientes para Fase 6 cuando Expo lo arregle.

**Estado de fases del plan (actualizado):**

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Setup | ✅ |
| 1 | Backend Core | ✅ |
| 2 | Matchmaking | ✅ |
| 3 | Game Loop | ✅ |
| 4 | Agora WebRTC | ✅ (sin validar en device) |
| 5 | Resultados | ✅ Implementada, falta validar visual |
| 6 | Animaciones & Sonidos | 🟡 Parcial (falta expo-av, transiciones slam/zoom entre turnos) |
| 7 | Onboarding & Moderación | 🟡 Parcial (falta report modal, edge cases de desconexión) |
| 8 | Testing & Deploy | 🔄 Vitest foundation OK; falta device + e2e |

---

## 2026-07-29 — Testing foundation (T0 + T1 + integración server)

**Branch:** `feature/testing-foundation` → mergeada a `develop` junto con results.

**Decidido:**
- Stack de tests: **Vitest** en server y client (utils/stores). Sin Jest por ahora.
- E2E (Maestro) y CI GitHub Actions quedan para fases T4/T5 posteriores.
- Tests unitarios colocalizados (`*.test.ts` al lado del módulo).
- Integración Socket.io en `server/src/__tests__/integration/`.
- Script ad-hoc `run.ts` eliminado; reemplazado por Vitest.

**Implementado:**
- Server: Vitest + helpers `socketHarness` (server efímero, disconnect real como `index.ts`).
- Unit: Scoring, SongBank, RoomManager, ReportHandler, rateLimitCore, GameSession (fake timers), AgoraTokenGenerator.
- Integration: game-flow completo (5 rondas + rematch), disconnect en round_active, rate-limit create_room.
- Client: timerSync, useGameStore, useRoomStore.
- Scripts root: `npm test`, `npm run test:server`, `npm run test:all`.

**Bugs encontrados y arreglados al testear:**
1. **rateLimiter no respondía ack** al bloquear: `packet.data` aún no tiene el callback (Socket.io lo inyecta dentro de `onevent`). Fix: `socket.ack(packet.id)({ success: false, error })`.
2. **Tras expirar el block de 30s, se re-bloqueaba al instante** porque los timestamps viejos seguían en la ventana. Fix: al vencer `blockedUntil`, limpiar timestamps.
3. Harness de tests no registraba `disconnect` → `player_disconnected` nunca se emitía en integration.

**Resultados:**
- Server: **66 passed | 1 todo** (disconnect en countdown = Fase 7).
- Client: **11 passed**.
- `tsc --noEmit` OK en root y server.

**Git (esta sesión):**
- Mergeados a `develop`: testing-foundation + results-screen.
- Ramas feature locales eliminadas.
- Remote `origin/feature/results-screen` pendiente de borrar tras push.

**Pendiente inmediato:**
1. Validar audio Agora + results en device real (2 celulares).
2. Ampliar tests de store con `gameOver`/`rematch` (ya en develop post-merge).
3. T4 Maestro / T5 CI cuando haya APK estable.

**Cómo correr tests:**
```bash
npm test                 # client unit
npm run test:server      # server unit + integration (~45s)
npm run test:all         # ambos
```

**Branch actual:** `develop`.
