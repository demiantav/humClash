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
