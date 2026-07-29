# AGENTS.md — HumClash

Este archivo le da contexto al agente (OpenCode) sobre el proyecto. Léelo antes de tocar código.
Ver también `DECISIONS.md` para el historial de decisiones entre sesiones (OpenCode no
tiene memoria propia — este par de archivos la reemplaza).

## 1. Qué es este proyecto

Juego social 1v1 en tiempo real: un jugador tararea una canción por voz en vivo, el otro
adivina entre 4 opciones antes de que se acabe el tiempo. 5 rondas por partida, roles
invertidos cada ronda. MVP validando una hipótesis simple: ¿es divertido tararear y
adivinar canciones contra un amigo en tiempo real?

**Diferencial clave:** el audio lo genera el propio jugador tarareando — no se reproduce
audio grabado con derechos de autor. Esto evita la carga de licencias musicales que sí
tienen competidores como SongPop o Guessong, y es la ventaja competitiva #1 del producto.
No perder esto de vista al diseñar features nuevas: cualquier feature que implique
reproducir audio grabado de una canción real rompe este diferencial y abre un problema
legal — evitarlo.

**Equipo:** 1 solo desarrollador. Todas las decisiones de alcance deben asumir esta
restricción. No hay diseñador visual ni motion designer dedicado.

**Nombre definitivo:** HumClash (el repo ya lo refleja).

## 2. Público objetivo y fases de lanzamiento

- **Fase 1 (validación):** público hispanohablante, Latinoamérica. Bajo costo de
  adquisición, sesiones largas, ideal para medir retención antes de invertir en marketing.
  Banco de canciones con mezcla real de reggaetón, rock en español, cumbia, clásicos
  latinos — no pop genérico en inglés.
- **Fase 2 (escala):** USA y Europa. Requiere mayor pulido de UX/onboarding (expectativa
  más alta en estos mercados) y banco de canciones localizado a tendencias locales.
  No lanzar acá hasta tener señal clara de retención en Fase 1.
- **Monetización inicial:** publicitaria (banner/rewarded ads), sin IAP agresivo en el
  MVP. Evaluar IAP (paquetes temáticos de canciones) recién en Fase 2, una vez validado
  el loop de juego.
- **Prioridad de matchmaking en MVP:** salas privadas por código (invitar amigo) por
  encima del matchmaking aleatorio. Con poca base de usuarios al inicio, el matchmaking
  random puede dejar a la gente esperando sin encontrar rival — mata la retención en la
  primera experiencia. El aleatorio queda como secundario hasta haber masa crítica online.

## 3. Stack tecnológico

- **Frontend:** React Native + Expo (iOS y Android desde una sola base de código). Usar
  Expo Dev Client (no Expo Go) porque Agora requiere módulos nativos.
- **Backend de juego:** Node.js + Socket.io — gestor de salas, lógica de turnos,
  temporizadores, puntuación. Hosting en Render (free tier para MVP).
- **Voz en tiempo real:** Agora.io (WebRTC) — transmisión de audio P2P de baja latencia.
  Tokens generados por el backend (App ID nunca sale del servidor). Solo el jugador con
  rol "hummer" transmite — controlado server-side. Confirmar cobertura/latencia real en
  los países de lanzamiento de Fase 1 durante la Fase 8 (testing).
- **Estado global:** Zustand (ligero, sin providers, actualizaciones rápidas).
- **Navegación:** Expo Router (file-based routing).
- **Motion/animación:** React Native Reanimated para el MVP. Rive se evalúa post-MVP
  cuando haya un `.riv` con state machines listo. Con Reanimated se implementan:
  screen shake, confetti, combo counter, transiciones slam/zoom, timer bar animada,
  squash & stretch en botones.
- **Sonidos:** expo-av para efectos de sonido (correcto, incorrecto, tick, victoria, etc.).
- **Haptics:** expo-haptics sincronizados con cada micro-interacción.
- **Base de datos:** NINGUNA en el MVP. Todo en memoria del servidor. Salas, turnos,
  puntajes y reportes viven durante la sesión y mueren al terminar.
- **Costo de infraestructura de voz:** Agora cobra ~$0.99 por 1,000 minutos. Con 2
  jugadores × 5 rondas × ~20s de audio activo = ~3.3 min/partida ≈ $1 por cada ~300
  partidas.

## 4. Memoria entre sesiones

OpenCode no recuerda nada entre sesiones por defecto. Este archivo es estático.

- Decisiones de arquitectura, cambios de alcance o pendientes importantes van a
  `DECISIONS.md` (raíz del repo).
- Al cerrar una sesión de trabajo significativa: pedirle al agente "Agregá un resumen de
  lo decidido/pendiente en DECISIONS.md".
- Al abrir una sesión nueva: pedirle que lea `AGENTS.md` + `DECISIONS.md` antes de tocar
  código.

## 5. Screaming Architecture

La estructura de carpetas grita QUÉ HACE la app (dominio del juego), no de qué framework
está hecha. Agrupar primero por feature/módulo de juego, no por tipo técnico.

```
src/
  features/
    auth-guest/            # apodo temporal, sin registro en MVP
      components/
      hooks/
    matchmaking/           # crear sala privada (prioridad MVP) + random (secundario)
      components/
      hooks/
      socket-events.ts
    game-round/            # bucle principal: turno de tarareo + turno de adivinanza
      components/
      hooks/
      animations/           # animaciones Reanimated (screen shake, confetti, combo counter)
      socket-events.ts
    voice-stream/           # integración WebRTC (Agora)
      hooks/
    moderation/             # botones silenciar/reportar en HUD
      components/
    scoring/                # cálculo de puntos según velocidad de respuesta
      hooks/
    results/                # pantalla de resultados + revancha
      components/
      animations/           # confetti, festejo de victoria
  shared/
    components/             # UI genérica (botones, modals, HUD base)
    lib/
      socket-client.ts
      agora-client.ts
    types.ts
server/
  rooms/                    # gestor de salas Socket.io
  game-logic/                # turnos, temporizadores, puntuación, SongBank (30 canciones)
  moderation/                 # reportar/silenciar jugador (obligatorio desde MVP)
  security/                  # rate limiting por IP
DECISIONS.md
```

Regla simple: si dudás dónde va un archivo, preguntate "¿a qué parte del loop de juego
pertenece?" — no "¿qué tipo de archivo es?".

## 6. Dirección de diseño — motion / gaming / arcade

Referencia de estilo: Crazy Taxi, Sonic — energía arcade Y2K, no minimalismo corporativo.
Regla general: cada animación debe dar feedback real sobre algo que pasó en el juego: si
cumple eso, meterle toda la energía posible; si es navegación estática, mantenerlo limpio.

- **Paleta:** saturada, alto contraste, colores primarios intensos. Nada de pastel/corporate.
- **Tipografía:** chunky, redondeada, con inclinación dinámica — especialmente en
  score/timer/combo counter.
- **Squash & stretch** en todo elemento interactivo (botón de mic al presionar, ícono de
  acierto al rebotar).
- **Screen shake + flash de color** en: acierto, pérdida de turno, fin de ronda.
- **Combo counter con escalado progresivo** — crece y cambia de color con cada acierto
  consecutivo. Implementar con Reanimated en el MVP (Reanimated solo, sin Rive). Usar
  `withSpring` para el rebote al incrementar, colores por nivel (blanco → amarillo →
  naranja → rojo/dorado). Rive se evalúa post-MVP cuando haya estado máquina listo.
- **Transiciones tipo slam/zoom** entre turnos (cantante↔adivinador), no fade suave.
- **Confetti/partículas explosivas** en pantalla de resultados/victoria — no un modal
  discreto.
- **Haptics + sonido sincronizados** con cada micro-interacción: vibración corta en
  acierto, más larga en victoria.

## 7. Moderación (obligatorio desde el MVP, no opcional)

Hay voz en vivo entre desconocidos. Todo turno debe tener acceso visible a
reportar/silenciar al otro jugador. No se lanza sin esto, ni siquiera en la versión de
prueba con 50 usuarios.

- **Silenciar:** toggle local (corta audio entrante vía Agora `muteRemoteAudioStream`).
  El jugador muteado NO sabe que fue muteado — evita represalias.
- **Reportar:** botón de bandera → modal con motivos rápidos → backend registra en array
  en memoria (sin acción automática en MVP).
- Ambos botones deben ser accesibles (touch target ≥ 48dp) pero discretos en la esquina
  superior del HUD.

## 8. Git workflow

**Ramas:**

- `main` → producción. Solo se mergea desde `develop` vía PR. Nunca commits directos.
- `develop` → integración. Todo entra vía PR desde una rama de feature/fix. Nunca commits
  directos.
- `feature/<nombre-corto>` → una por feature (ej. `feature/matchmaking-salas-privadas`,
  `feature/voice-stream-livekit`). Sale de `develop`, vuelve a `develop`.
- `fix/<nombre-corto>` → una por bug (ej. `fix/combo-counter-desync`). Sale de `develop`,
  vuelve a `develop`.
- `hotfix/<nombre-corto>` → solo bugs críticos ya en producción. Sale de `main`, mergea a
  `main` Y a `develop`.

**Regla para el agente:** antes de tocar código, verificar rama actual
(`git branch --show-current`). Si está en `main` o `develop`, crear la rama `feature/*`
o `fix/*` correspondiente ANTES de cualquier cambio.

**Commits:** Conventional Commits.

```
feat(matchmaking): agregar salas privadas con código de invitación
fix(voice-stream): corregir desconexión de audio al perder señal
chore(deps): actualizar rive-react-native
docs: actualizar DECISIONS.md con fases de lanzamiento
```

Prefijos: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`. El scope es el nombre de la
feature (carpeta en `src/features/`).

**Flujo típico:**

```bash
git checkout develop
git pull
git checkout -b feature/matchmaking-salas-privadas
# ... trabajo ...
git add .
git commit -m "feat(matchmaking): agregar salas privadas con código de invitación"
git push -u origin feature/matchmaking-salas-privadas
# abrir PR contra develop
```

**CI (GitHub Actions):** push/PR a `develop` o `main` corre
`.github/workflows/test.yml` → lint (tsc) + Vitest client + Vitest server.
No incluye e2e ni build EAS. Ver `npm run test:all` en local.

## 9. Modelos de IA recomendados (OpenCode Go, sin Claude)

- **Principal / arquitectura difícil** (lógica de sockets, sincronización WebRTC, state
  machines de Rive complejas): DeepSeek V4 Pro o GLM-5.2. Kimi K2.7 Code como segunda
  opinión en refactors puntuales.
- **Worker económico** (componentes repetitivos, CRUD, tests, scaffolding): DeepSeek V4
  Flash o Qwen3.6 Plus.
- Repartir así por cómo se miden los límites de Go (uso equivalente en dólares, no
  requests) — usar el modelo caro solo donde realmente rinde.

## 10. Skills recomendadas para este proyecto

- `frontend-design` (oficial) — sistema de diseño antes de generar UI.
- Vercel Web Design Guidelines — accesibilidad/UX (importante con controles táctiles y
  HUD de juego).
- Vercel React Best Practices — performance (crítico para animaciones fluidas en gama
  media/baja, muy relevante para el público de Fase 1 en LatAm).
- Precaución: cualquier skill de terceros, revisar antes de instalar — el ecosistema de
  skills tiene una tasa relevante de fallas de seguridad reportadas.

## 11. No hacer

- No reproducir audio grabado de canciones reales bajo ningún concepto (rompe el
  diferencial legal/de costo del producto).
- No lanzar sin el botón de reportar/silenciar visible en cada turno de voz.
- No priorizar matchmaking aleatorio sobre salas privadas en el MVP.
- No lanzar en Fase 2 (USA/Europa) sin señal de retención confirmada en Fase 1.
- No asumir que la transmisión de voz es gratis — calcular costo por partida antes de
  escalar usuarios.

## 12. Performance (obligatorio, no opcional)

El target de Fase 1 usa mayoritariamente Android gama media (Snapdragon 600/700,
3-4 GB RAM). Lo que funcione fluido en simulación de iPhone no implica que sea
usable en Moto G / Samsung A.

- **Métrica objetivo:** ≥ 30 FPS en game screen con Agora transmitiendo + Reanimated
  corriendo + Socket.io activo simultáneamente.
- **RAM:** < 300 MB en uso pico para no ser matado por el SO.
- **Timer sync:** el timer corre server-side (fuente de verdad). El cliente ajusta su
  barra con `serverTimestamp` del evento `timer_sync`, no con `setInterval` local.
  Tolerancia máxima de desync: ±200ms.
- **Medir en dispositivo real** (no simulador) con Network Link Conditioner simulando
  3G/4G de LatAm antes de asumir que "funciona".
- **Reanimated corre en UI thread** (ok), Socket.io y Agora en JS thread. Cuidado con
  saturar el bridge.
- **Sonidos pregrabados** (expo-av), no sintetizados en runtime.

## 13. Seguridad

Sin autenticación real, el MVP es vulnerable a abuso simple. Mitigaciones mínimas:

- **Rate limiting** por IP en Socket.io: 3 creaciones de sala/min, 10 intentos de
  join/min, 5 reportes/min.
- **Agora App ID nunca en el cliente.** El token se genera en el backend y se envía
  por Socket.io al unirse a una sala y al cambiar de rol.
- **Solo el hummer transmite audio.** El servidor asigna `role: PUBLISHER` al hummer
  y `role: SUBSCRIBER` al guesser en el token de Agora. El guesser está muteado por
  el servidor, no depende de que el cliente "se comporte bien".
- **No se graba audio.** Cloud recording de Agora explícitamente deshabilitado.
- Disclaimer en onboarding: "No grabamos tu voz ni almacenamos audio de tus partidas."

## 14. UX — Principios no negociables

- **Todo botón tiene feedback inmediato:** scale-down (`withSpring` a 0.95) + haptic
  light + sonido pop. Sin excepciones.
- **El silencio incomoda al tararear.** El hummer debe ver feedback de que su audio
  está llegando (RemoteAudioStatus: "tu rival te escucha"). Cuenta regresiva 3-2-1
  + mensaje "¡Dale! ¡No hay vergüenza!" antes de empezar.
- **El guesser sin contexto se frustra.** A los 10s sin respuesta, mostrar hint
  textual (campo `hint` del banco de canciones). Botón "Tarareá de nuevo" (1 vez
  por ronda).
- **Lobby interactivo:** mientras espera rival, mostrar logo respirando +
  instrucciones en carrusel + "Compartí el código". Nada de texto estático.
- **Indicador de progreso de partida:** 5 dots. El jugador debe saber en qué ronda
  está y cuántas faltan.
- **Revancha con narrativa:** "Perdiste la primera, ¿vas a dejar que gane la serie?"
  — darle contexto competitivo. Siempre mostrar un dato positivo al perdedor
  ("Adivinaste 2 en menos de 3 segundos").
- **Cambio de rol dramático:** transición slam/zoom + cambio de color de fondo
  (azul=hummer, naranja=guesser) + whoosh + haptic.
- **Timer últimos 3s intenso:** barra parpadea rojo, número escala up, haptics
  heartbeat. Que el jugador Sienta la urgencia.

## 15. Accesibilidad

- **Contraste WCAG AA:** todos los textos ≥ 4.5:1 (normal) o ≥ 3:1 (grande >18pt).
  Verificar con WebAIM Contrast Checker en todos los estados de todos los componentes.
- **Touch targets ≥ 48x48dp** en todo elemento interactivo. Si visualmente es más
  chico, usar `hitSlop` o `Pressable` padre.
- **Texto nunca menor a 12pt.**
- **Feedback multicanal:** visual (color, animación) + háptico (vibración) + sonido.
  Si el teléfono está en silencio, los haptics son el canal secundario. Si la
  vibración está desactivada, el flash de color en pantalla es la tercera capa.
- **No depender solo de color:** el acierto/error se indica con ícono + color + animación.

## 16. Banco de canciones — Fase 1

30 canciones curadas para público hispanohablante. Distribución: 8 reggaetón, 8 rock,
3 cumbia, 7 pop latino, 2 balada, 2 clásico. Dificultad: 10 fáciles, 12 medias,
8 difíciles.

Cada canción tiene `hint` textual obligatorio (se muestra al guesser a los 10s).
No hay archivos de audio — el jugador tararea. Las canciones se eligen al azar sin
repetir en una misma partida (5 rondas → 5 canciones diferentes).

Estructura de datos: `{ id, title, artist, genre, difficulty, decade, hint }`
