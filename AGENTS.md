# AGENTS.md — HumClash

Este archivo le da contexto al agente (OpenCode) sobre el proyecto. Léelo antes de tocar código.

| Archivo | Rol |
|---------|-----|
| `PRODUCT.md` | Producto / GDD (fantasía, loop, fair-play, roadmap de valor) |
| `DECISIONS.md` | Bitácora de decisiones entre sesiones |
| `AGENTS.md` | Este archivo: stack, arquitectura, convenciones para el agente |

OpenCode no tiene memoria propia — este trío la reemplaza.

## 1. Qué es este proyecto

Juego social 1v1: un jugador tararea una canción con su voz, el otro adivina entre 4
opciones. 5 rondas por partida, roles invertidos cada ronda. Hipótesis a validar: ¿es
divertido tararear y adivinar contra otra persona de forma que quieras la siguiente ronda?

**Fantasía de producto:** tu voz es el challenge. No somos Preguntados con mic ni un
radio-quiz con tracks licenciados. Ver `PRODUCT.md` para posicionamiento completo.

**Diferencial clave:** el audio lo genera el propio jugador tarareando — no se reproduce
audio grabado de una canción real con derechos de autor. Esto evita licencias (SongPop /
Guessong) y es la ventaja #1. Cualquier feature que reproduzca el master de una canción
real rompe el diferencial — evitarlo.

**Equipo:** 1 solo desarrollador. Todas las decisiones de alcance asumen esa restricción.

**Nombre definitivo:** HumClash.

## 2. Público objetivo y fases de lanzamiento

- **Fase 1 (validación):** público hispanohablante, Latinoamérica. Bajo costo de
  adquisición, sesiones largas, ideal para medir retención antes de invertir en marketing.
  Banco de canciones con mezcla real de reggaetón, rock en español, cumbia, clásicos
  latinos — no pop genérico en inglés.
- **Fase 2 (escala):** USA y Europa. Requiere mayor pulido de UX/onboarding (expectativa
  más alta en estos mercados) y banco de canciones localizado a tendencias locales.
  No lanzar acá hasta tener señal clara de retención en Fase 1.
- **Monetización:** sin IAP agresivo ni ads en medio del turno mientras se valida el loop.
  Ads solo en bordes (fin de partida / rewarded) post-señal de diversión. IAP futuro =
  packs temáticos de *títulos/clima* (metadatos), nunca masters de audio. Ver `PRODUCT.md`.
- **Prioridad de matchmaking en MVP:** salas privadas por código (invitar amigo) por
  encima del matchmaking aleatorio. Con poca base de usuarios al inicio, el matchmaking
  random puede dejar a la gente esperando sin encontrar rival — mata la retención en la
  primera experiencia. El aleatorio queda como secundario hasta haber masa crítica online.
- **Norte de hábito (roadmap):** turnos async + push (aprendizaje de Preguntados). El
  pipeline de **clips** lo habilita; async completo (DB, push, multi-duelo) sigue siendo
  capa posterior — ver `PRODUCT.md` §10 y `DECISIONS.md` 2026-08-05.

## 3. Stack tecnológico

- **Frontend:** React Native + Expo (iOS y Android). Expo Dev Client mientras haya
  módulos nativos de grabación/playback que lo requieran; re-evaluar Expo Go si el
  pipeline de audio queda 100% en APIs compatibles con Go.
- **Backend de juego:** Node.js + Socket.io — salas, turnos, timers, puntuación,
  orquestación de clips (URL/id del take). Hosting previsto: Render (free tier MVP).
- **Voz (decisión cerrada 2026-08-05): clips, no WebRTC.**
  - Hummer: graba localmente (límite estricto ~20s) → upload a storage efímero → listo.
  - Guesser: descarga/stream del clip y reproduce; no hay mic en vivo del rival.
  - **Agora / WebRTC: deprecado.** No nuevas features sobre `voice-stream`/Agora. Código
    legado se elimina o aísla en la migración (`feature/voice-recording`).
  - Lib de grabación/playback: preferir APIs Expo estables (expo-audio / expo-av según
    compat RN del proyecto). Elegir en la rama de migración; no inventar un stack paralelo.
  - Storage: proveedor TBD (Supabase Storage, S3, R2, o backend que reciba el blob en MVP
    chico). **TTL corto** — borrar al fin de ronda o de partida (máx. horas, no archivo
    permanente). Medir costo storage/egress antes de escalar.
- **Estado global:** Zustand.
- **Navegación:** Expo Router (file-based).
- **Motion:** React Native Reanimated (MVP). Rive post-MVP si hay `.riv` con state machines.
- **Sonidos SFX:** mismos módulos de audio que playback de clips cuando sea posible.
  Nunca para masters de canciones reales.
- **Haptics:** expo-haptics en micro-interacciones.
- **Base de datos:** NINGUNA mientras el MVP sea síncrono en sala (clips en vuelo +
  memoria). Async/multi-duelo del roadmap **sí** requerirá persistencia — decisión aparte.

## 4. Memoria entre sesiones

OpenCode no recuerda nada entre sesiones por defecto.

- Producto / reglas de juego → `PRODUCT.md`
- Arquitectura, alcance, pendientes de sesión → `DECISIONS.md`
- Al cerrar sesión significativa: actualizar `DECISIONS.md` (y `PRODUCT.md` si cambió
  una regla de producto).
- Al abrir sesión: leer `AGENTS.md` + `PRODUCT.md` + `DECISIONS.md` antes de tocar código.

## 5. Screaming Architecture

La estructura de carpetas grita QUÉ HACE la app (dominio del juego), no de qué framework
está hecha. Agrupar primero por feature/módulo de juego, no por tipo técnico.

```
src/
  features/
    auth-guest/            # apodo temporal, sin registro en MVP
    matchmaking/           # salas privadas (prioridad) + lobby + géneros (modelo A)
    game-round/            # loop: pick canción (1 de 3) + hum + guess + combo
      components/          # SongPickCards, SkipSong, TimerBar, opciones, etc.
      hooks/
      animations/
      socket-events.ts
    voice-recording/       # grabar clip, upload, playback (reemplaza voice-stream/Agora)
    moderation/            # silenciar playback local / reportar take
    scoring/
    results/               # confetti, tabla, revancha
  shared/
    components/
    lib/                   # socket-client, storage-client
    types.ts
server/
  rooms/
  game-logic/              # turnos, timers, score, SongBank, pool géneros, pick 1 de 3, clip refs
  moderation/
  security/
  # (opcional) storage signed URLs / cleanup TTL
PRODUCT.md
DECISIONS.md
AGENTS.md
```

Regla: si dudás dónde va un archivo, preguntate "¿a qué parte del loop de juego
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

Hay voz entre jugadores. Todo turno con audio debe tener acceso visible a
reportar/silenciar. No se lanza sin esto.

- **Silenciar / pausar:** toggle local del **playback** del clip del rival. El otro no
  sabe que lo silenciaron.
- **Reportar:** bandera → motivos rápidos → backend registra (ideal: asociar id del take
  mientras viva el TTL). Sin ban automático en MVP.
- Touch target ≥ 48dp, discretos en esquina superior del HUD.

## 8. Git workflow

**Ramas:**

- `main` → producción. Solo se mergea desde `develop` vía PR. Nunca commits directos.
- `develop` → integración. Todo entra vía PR desde una rama de feature/fix. Nunca commits
  directos.
- `feature/<nombre-corto>` → una por feature (ej. `feature/voice-recording`,
  `feature/song-fair-play`). Sale de `develop`, vuelve a `develop`.
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
feat(voice-recording): grabar clip de hum y reproducir en guesser
chore(deps): quitar react-native-agora
docs: actualizar DECISIONS.md con migración a clips
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

- **Principal / arquitectura difícil** (sockets, pipeline de clips/upload, state machines):
  DeepSeek V4 Pro o GLM-5.2. Kimi K2.7 Code como segunda opinión en refactors puntuales.
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

- No reproducir **masters** de canciones reales (copyright). El tarareo del jugador sí.
- No volver a meter **Agora/WebRTC** como pipeline principal del MVP (decisión 2026-08-05).
  Live “VIP” solo con decisión nueva en `DECISIONS.md`.
- No lanzar sin reportar/silenciar (playback) visible en turno de voz.
- No priorizar matchmaking aleatorio sobre salas privadas en el MVP.
- No lanzar en Fase 2 sin retención confirmada en Fase 1.
- No asumir storage/egress gratis — medir costo real antes de escalar.
- No meter ads en medio del take o del guess.
- No copiar coronas/ruleta de Preguntados como identidad del producto.
- No feed público de tarareos ni retención indefinida de clips.
- No implementar async/DB/push sin decisión explícita en `DECISIONS.md` (clips síncronos
  en sala van primero).

## 12. Performance (obligatorio, no opcional)

El target de Fase 1 usa mayoritariamente Android gama media (Snapdragon 600/700,
3-4 GB RAM). Lo que funcione fluido en simulación de iPhone no implica que sea
usable en Moto G / Samsung A.

- **Métrica objetivo:** ≥ 30 FPS en game screen con grabación o playback de clip +
  Reanimated + Socket.io activos.
- **RAM:** < 300 MB en uso pico para no ser matado por el SO.
- **Timer sync:** el timer corre server-side (fuente de verdad). El cliente ajusta su
  barra con `serverTimestamp` del evento `timer_sync`, no con `setInterval` local.
  Tolerancia máxima de desync: ±200ms.
- **Upload/playback en 3G/4G LatAm:** medir tiempo de subida de ~20s de audio y UX de
  “subiendo…” / reintento; no asumir WiFi de oficina.
- **Reanimated en UI thread** (ok); Socket.io y I/O de audio en JS thread — no saturar
  el bridge.
- **SFX y clips de hum** vía APIs de audio del stack elegido; no sintetizar SFX en runtime.

## 13. Seguridad y privacidad de voz

Sin autenticación real, el MVP es vulnerable a abuso simple. Mitigaciones mínimas:

- **Rate limiting** por IP en Socket.io: 3 creaciones de sala/min, 10 intentos de
  join/min, 5 reportes/min; limitar uploads de clip por partida/IP.
- **Clips efímeros:** storage con TTL; borrar al cerrar ronda/partida (o job de cleanup).
  URLs firmadas de corta vida si el storage es público-por-URL.
- **Solo el hummer genera el take** de esa ronda; el guesser solo reproduce la URL/id
  que el servidor autoriza para esa sala/ronda.
- **No reutilizar** credenciales de Agora (deprecado). Limpiar secrets Agora del cliente
  y de EAS al migrar.
- **Disclaimer onboarding (honesto):** el tarareo se sube solo para que el rival lo oiga
  en esa ronda/partida y se borra después. No es feed público ni archivo permanente.

## 14. UX — Principios no negociables

- **Todo botón tiene feedback inmediato:** scale-down (`withSpring` a 0.95) + haptic
  light + sonido pop. Sin excepciones.
- **Fair-play de canciones (producto cerrado — ver `PRODUCT.md` §5):**
  1. **Géneros lobby modelo A:** cada jugador marca 0–3 géneros (0 = De todo). Pool
     prioriza intersección; si el pool queda chico (~15), rellena automático.
  2. **Pick 1 de 3:** al inicio del turno hum, 3 cards (título · artista · género ·
     dificultad). El hummer elige 1 antes del countdown.
  3. **Skip "No la conozco":** 2 por jugador por partida; renueva 3 cards nuevas.
  4. Guesser nunca ve el título por las cards; solo audio + 4 opciones al adivinar.
- **Vergüenza al tararear.** Countdown 3-2-1 + "¡Dale! ¡No hay vergüenza!" / "no hace
  falta cantar bien". Feedback de **nivel de mic** al grabar + estado claro de envío
  (“Subiendo…” → “¡Enviado!”). Tensión de **una toma** (sin edición infinita); fair-play
  de *canción* (1 de 3 + skip) cubre “no la conozco”.
- **El guesser sin contexto se frustra.** Hint textual (`hint`) a los ~10s. **Re-listen**
  del clip 1 vez/ronda (no es skip de canción ni re-grabación del hummer).
- **Lobby interactivo:** logo respirando + carrusel + código + **chips de género**.
- **Indicador de progreso:** 5 dots de ronda.
- **Revancha con narrativa** + dato positivo al perdedor.
- **Cambio de rol dramático:** slam/zoom + color (azul=hummer, naranja=guesser).
- **Timer últimos 3s intenso:** barra roja, scale, haptics heartbeat.

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

**Objetivo de catálogo:** suficiente variedad para fair-play (géneros + 1 de 3 + skips)
sin agotar el pool en una tarde de rematches. MVP técnico actual: ~30 canciones.
**Meta soft launch:** ampliar hacia 60–80 y rotación ops (+N/semana). Ver `PRODUCT.md`.

Distribución orientativa (ajustar al crecer): reggaetón, rock ES, cumbia, pop latino,
baladas, clásicos. Mezcla de dificultades con **buenas fáciles** (si el pool filtrado
queda sin fáciles, el fair-play falla).

- `hint` textual obligatorio (guesser ~10s).
- No hay archivos de audio de la canción — el jugador tararea.
- Anti-repeat en la misma partida; idealmente también en serie de rematches.
- Pick: el server ofrece **3 candidatas** del pool filtrado por géneros de la sala;
  el hummer elige 1 (no es “1 canción impuesta al azar” sin agencia).
- Distractores del guess: preferir mismo género/década (“barrio” musical).

Estructura: `{ id, title, artist, genre, difficulty, decade, hint }`
(`hummerHint` opcional a futuro — solo visible al hummer, sin audio copyrighted).

## 17. Próximo desarrollo (orden sugerido)

Fuente de valor: `PRODUCT.md` §10. Orden práctico post-decisión clips:

1. **`feature/voice-recording`** — pipeline clips: grabar → upload → playback; quitar
   dependencia de juego de Agora; disclaimer; TTL/cleanup. Aparcar/borrar
   `fix/agora-role-publish` (ya no es gate).
2. **`feature/song-fair-play`** — géneros lobby (A) + pick 1 de 3 + skip 2×.
3. Integrar clips + fair-play en loop síncrono en sala; test 2 devices.
4. Pulido results / animaciones / report modal.
5. Async + push + multi-duelo solo con decisión de persistencia en `DECISIONS.md`.
