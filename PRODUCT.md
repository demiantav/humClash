# PRODUCT.md — HumClash

Documento de producto (GDD liviano). Define **qué es el juego y por qué**, no el stack.
Para arquitectura/código ver `AGENTS.md` y `DECISIONS.md`.

Última elaboración de producto: 2026-08-05.

---

## 1. Identidad

**HumClash** es un duelo 1v1 de tararear y adivinar canciones.

**Fantasía:** tu voz es el challenge. No reproducimos la canción: la tarareás vos. Una toma con tensión. Que el otro adivine.

**Hipótesis a validar:** ¿es divertido tararear y adivinar canciones contra otra persona (amigo o rival) de forma que quieras la siguiente ronda / el siguiente duelo?

**Diferencial #1 (no negociable):** el audio lo genera el jugador tarareando. Nunca se reproduce audio grabado de una canción real con derechos de autor. Eso evita licencias y separa el producto de SongPop / music quiz clásicos.

**Tono:** roast amistoso + cultura musical + energía arcade (Crazy Taxi / Sonic), no minimalismo corporativo ni “trivia escolar”.

### Posicionamiento (qué no somos)

| Ellos | Ellos ganan por… | Ellos duelen en… | HumClash dobla en… |
|-------|------------------|------------------|---------------------|
| **Preguntados** | Turnos, push, multi-duelo, hábito LatAm | Ads agresivos, trivia fría, fatiga | Voz humana, música vivida, ritmo sagrado del turno |
| **SongPop / music quiz** | Reconocer el track real en segundos | Licencias, paywalls de packs, poco “momento con mi amigo” | User-generated humming, sin master recordings |
| **Draw Something (legado)** | Async creativo 1v1 | Espera vacía, monetización que mató el alma | Payload emocional en cada “te toca”, reacciones, arcade |
| **Party same-room** | Caos en el sillón | No sirve a distancia | Duelo a distancia + modo sesión caliente cuando están juntos |

**Frase de posicionamiento:**

> HumClash — el duelo donde tu voz es el challenge. No ponemos la canción. La tarareás vos.

### Lo que no somos

- Un Preguntados con micrófono (sin coronas, ruleta de 6 categorías ni granja de partidas sin alma).
- Una radio-quiz con catálogo licenciado.
- Un feed público de tarareos (toxicidad + vergüenza + moderación imposible a escala chica).
- Un free-to-play que interrumpe el take o el guess con ads.

---

## 2. Público y fases

| | Fase 1 — Validación | Fase 2 — Escala |
|--|---------------------|-----------------|
| **Dónde** | LatAm / hispanohablante | USA + Europa |
| **Por qué** | CAC bajo, sesiones sociales, banco local | Exige más UX y catálogo localizado |
| **Gate** | — | Retención clara en F1 antes de invertir |
| **Canciones** | Reggaetón, rock ES, cumbia, pop latino, baladas, clásicos | Tendencias locales por mercado |

**Matchmaking / social en validación:** salas / duelos con gente conocida (código, link, invitación) por encima del random masivo. Sin masa crítica, el random deja gente sola y mata la primera experiencia.

**Equipo:** 1 desarrollador. Toda feature se juzga con esa restricción.

---

## 3. Pilares de experiencia

1. **Ritmo sagrado del turno** — Entre “te toca tararear” y “adivinaste / fallaste” no hay interstitial ni fricción basura. Ads solo en bordes (fin de partida / rewarded opcional), y recién cuando el loop ya divierte.
2. **Roast amistoso + música** — Fallar y tararear mal son parte del show, no errores grises.
3. **Arcade Y2K** — Squash & stretch, screen shake, combo, slam de rol, confetti, haptics + sonido multicanal. Cada animación feedbackea algo real del juego.
4. **Fair-play al tararear** — El hummer tiene agencia (géneros, elegir canción, skip). Nadie queda forzado a un tema que no conoce.
5. **Privacidad de voz** — El pipeline es **clip grabado efímero** (no stream en vivo). Disclaimer honesto: se sube solo para la ronda/partida y se borra. Sin feed público ni archivo permanente.
6. **Ambos roles divertidos** — En la misma partida sos show (hum) y cazador (guess).

---

## 4. Core loop

**Unidad de drama:** take de voz + adivinanza.

```
HUM                          CLASH / GUESS                 RESOLVE
Te toca tararear        →    Rival recibe / escucha    →   Acierto o error
Fair-play de canción         Timer + 4 opciones            Feedback arcade
Countdown + grabación        (hints según reglas)          Puntos / combo
Envío del take               Respuesta                     Siguiente rol o fin
```

**Doble habilidad (simétrica en el tiempo):**

- **Hummer:** claridad vs maldad controlada (reconocible o troll dentro de lo jugable).
- **Guesser:** oído + cultura musical vivida.

Nadie se queda solo tocando A/B/C para siempre: en el próximo tramo sos el instrumento.

---

## 5. Fair-play de canciones (cerrado)

Objetivo: que el hummer **no quede atrapado** con un tema que no conoce, sin vaciar la tensión del “una toma”.

### 5.1 Géneros en lobby — modelo A

- **Cuándo:** lobby, antes de ready / inicio de partida.
- **Quién:** **cada jugador** marca **0–3** géneros (chips).
- **0 géneros o nada tocado** = “De todo” (sin filtro para ese jugador).
- **Pool de la partida:**
  1. Prioriza **intersección** de géneros entre ambos.
  2. Si el pool queda por debajo de un mínimo (ej. **15 canciones**), **rellena** automáticamente (fáciles del resto / unión ampliada).
  3. Toast suave opcional: “Sumamos más géneros para que no se trabe”.
- **Chips Fase 1 (ejemplo):** Reggaetón · Rock ES · Cumbia · Pop latino · Baladas · Clásicos · De todo.

### 5.2 Elegir 1 de 3 (cada turno hum)

- El server ofrece **3 cards** del pool (sin repetir en la partida según anti-repeat).
- Cada card muestra al hummer: **título · artista · género · dificultad**.
- El hummer **elige 1** y recién ahí entra countdown + grabación.
- El **guesser no ve** título ni artista de la correcta por esta vía.

### 5.3 Skip “No la conozco”

- Si ninguna de las 3 sirve: **“No la conozco / ninguna”**.
- **Límite:** **2 skips por jugador por partida**.
- Efecto: **renueva 3 cards nuevas** (no se reutilizan las descartadas en ese refresh).
- Skips agotados: debe elegir entre las 3 actuales (el filtro de géneros + 1 de 3 debería hacer esto raro).

### 5.4 Guesser

- Recibe el audio del take + **4 opciones** (1 correcta + 3 distractores).
- Distractores del mismo “barrio” musical (género/década) cuando sea posible: más justo y menos “obvio por estilo”.
- Hints según reglas de UX (ej. hint textual a los X segundos) — sin reproducir la canción real.

### 5.5 Flujo hummer (resumen)

```
Lobby: ambos marcan géneros (0–3) → pool de partida
        │
Te toca tararear
        │
   3 cards ──elegís 1──► countdown → grabás → envío
        │
   “No la conozco” (si quedan skips) → otras 3 cards
```

---

## 6. Mecánicas propias (capas)

No clonar la ruleta de coronas. Evolucionar desde el gag del tarareo.

| Capa | Mecánica | Rol en el producto | Prioridad |
|------|----------|--------------------|-----------|
| **Núcleo** | Hum + guess + puntaje + cambio de rol | Identidad | MVP |
| **Fair-play** | Géneros A + 1 de 3 + skip | Evita partidas rotas | MVP de producto |
| **Combo / racha** | Escalado visual al acertar seguido (sesión caliente o pack) | Tensión “una más” | Validar en sesión densa |
| **Modificadores** | Relámpago, doble puntos, solo ritmo, etc. (pocos, legibles) | Variedad sin otro juego | Post-core |
| **Rivalidad nombrada** | Serie vs esa persona, títulos bobos entre ustedes | Progresión social | Post-core |
| **Reacciones** | 1 tap post-guess (🔥💀 / note corta) | Cierra el gag en async | Post-core |
| **Hábito async** | “Te toca” con push, duelo que no exige coincidir online | Retención día a día | Norte roadmap |
| **Multi-duelo** | Varias rivalidades activas | Densidad tipo LatAm social | Después de 1 duelo estable |
| **Share** | Card de resultado / clip **opt-in** | Adquisición orgánica | Early growth, no antes del loop |
| **Contenido** | Rotación semanal de canciones + sugerencias users (ops → fábrica light) | Anti-agotamiento del banco | Ops desde soft launch |

### Modificadores (radar — no menú de 12 modos)

Ejemplos si se agregan: a cappella (default), solo ritmo, relámpago, doble o nada. **Como máximo un modificador ocasional por partida**, no un selector abrumador.

### Banco de canciones

- Metadatos: `{ id, title, artist, genre, difficulty, decade, hint }` (+ `hummerHint` opcional a futuro).
- Sin archivos de audio de la canción real.
- Anti-repeat en la misma partida (y en serie de rematches cuando aplique).
- Plan de **rotación/expansión** desde soft launch (ops manual al inicio: +N canciones/semana), no “ya veremos en fase 2”.
- Suficientes **fáciles** en el pool para que fair-play y géneros no dejen el pozo seco.

---

## 7. Motion y momentos de UX

Dirección: saturada, alto contraste, chunky type en score/timer/combo. Feedback multicanal (visual + háptico + sonido). Touch ≥ 48dp, contraste WCAG AA.

| Momento | Experiencia objetivo |
|---------|----------------------|
| Lobby / géneros | Chips claros, ready, código fácil de compartir |
| Te toca tararear | Paleta hum (ej. azul), 3 cards con personalidad, skips visibles |
| Countdown | 3-2-1 + copy anti-vergüenza (“no hace falta cantar bien”) |
| Grabando | Waveform / nivel de mic, timer, soltar o fin de tiempo |
| Envío | Whoosh / “1 TOMA” / arma lanzada |
| Inbox / te toca adivinar | Card del rival con energía, no lista gris |
| Escuchando | Foco total, timer; últimos 3s intensos (rojo, scale, heartbeat haptic) |
| Acierto | Shake + flash + combo spring + haptic success |
| Error | Miss stamp comedic, no castigo depresivo |
| Cambio de rol | Slam/zoom + cambio de color de fondo |
| Victoria / derrota | Confetti si ganás; siempre un dato positivo al que pierde |
| Share (cuando exista) | Card squishy a Stories/WhatsApp; voz solo con opt-in explícito |

**Regla:** si la animación no comunica un evento de juego, no va.

### Moderación (voz entre personas)

- Silenciar y reportar accesibles en todo turno con audio (touch target ≥ 48dp, discretos).
- Mute local sin notificar al otro (evita represalias).
- Report con motivos rápidos; backend registra (acción automática = post-MVP).
- Si hay audio almacenado temporalmente: el reporte puede asociarse al take; TTL y borrado obligatorios.

---

## 8. Monetización

| Etapa | Qué |
|-------|-----|
| Validación del loop | Sin IAP agresivo; idealmente sin ads en el medio del duelo |
| Post-señal de diversión | Ads en bordes; rewarded opcional |
| Escala | Packs temáticos de **títulos/clima** (metadatos), cosmética, quitar ads — **nunca** vender el master de la canción |

Unit economics de voz/storage se miden en prueba real antes de escalar paid acquisition.

---

## 9. Criterio para aceptar una feature

Antes de sumar algo al backlog de producto, debe pasar:

1. ¿Genera una **historia** que contarían mañana? (“me tarareó X como si fuera himno”)
2. ¿Los **dos roles** son divertidos en la misma experiencia?
3. ¿Se entiende en **~10 segundos** sin tutorial eterno?
4. ¿Corre en **Android gama media** (target F1)?
5. ¿Se puede mostrar en un **TikTok de ~7s**?

Si falla 1 o 3, no entra al núcleo.

---

## 10. Roadmap de producto (capas)

Orden de **valor de producto**, no de tickets de engineering. El repo puede estar en otro punto técnico; este orden es la brújula.

```
1. NÚCLEO
   Loop hum → guess → score → roles / fin de duelo
   Feel arcade básico en acierto/error/fin

2. FAIR-PLAY CANCIONES
   Géneros lobby (A) + 1 de 3 + skip 2×
   Banco LatAm con fáciles + anti-repeat + rotación ops

3. SESIÓN DENSA
   Combo/racha cuando hay continuidad
   Hints, anti-vergüenza, timer intenso
   Results + revancha con narrativa

4. HÁBITO (norte LatAm social)
   Turnos que no exigen estar online a la vez
   “Te toca” con carga emocional + push
   Un duelo async estable antes de multi-duelo

5. DENSIDAD SOCIAL
   Multi-duelo (varias rivalidades)
   Rivalidad nombrada + reacciones
   Invitación / deep link brutalmente fácil

6. CRECIMIENTO
   Share cards; clip de voz solo opt-in
   Sugerencia de canciones por users (moderada)

7. MONETIZACIÓN LIMPIA
   Bordes de ads / packs temáticos de títulos
```

### Nota de arquitectura (cerrada 2026-08-05)

- **Audio del tarareo = clips** (grabar → upload efímero → playback). **No WebRTC/Agora**
  como pipeline del MVP. Detalle técnico en `AGENTS.md` §3 y `DECISIONS.md` 2026-08-05.
- **Primer ship jugable:** clips **síncronos en sala** (ambos pueden estar online; el
  medio es archivo, no stream).
- **Async + push + multi-duelo:** sigue siendo capa de hábito del roadmap; requiere
  persistencia/DB — decisión aparte en `DECISIONS.md` antes de implementar.
- **Audio efímero + disclaimer honesto** son obligatorios con este pipeline.

---

## 11. Open questions

| Tema | Estado |
|------|--------|
| ¿WebRTC vs clips? | **Cerrado: clips** (2026-08-05) |
| ¿Primer ship síncrono en sala vs async-first? | **Síncrono en sala con clips primero**; async = capa posterior |
| ¿0 re-takes de mic vs 1 salvavidas? | Preferencia: tensión de una toma; fair-play de **canción** cubre “no conozco”. Re-listen del clip para el guesser: 1× |
| Proveedor de storage / TTL exacto | Pendiente al implementar `feature/voice-recording` |
| Lib exacta de grabación (expo-audio vs expo-av, etc.) | Pendiente en rama de migración (compat RN del proyecto) |
| Números de rondas / tiempos / score | Heredan del MVP técnico hasta playtests |
| Señales numéricas de retención | Definir al cerrar soft-launch plan |

---

## 12. Decisiones de producto cerradas

1. Identidad = duelo de tarareo user-generated, no trivia ni radio-quiz.
2. No copiar Preguntados; tomar aprendizajes de hábito (async/push como norte).
3. Fair-play: **géneros modelo A + pick 1 de 3 + skip 2×**.
4. **Audio = clips efímeros**, no stream en vivo (Agora deprecado para el MVP).
5. Monetización respetuosa del ritmo del turno.
6. Progresión social (rivalidad) > battle pass genérico.
7. Banco y rotación desde soft launch.
8. Roadmap en capas; async/multi-duelo después del loop con clips en sala.

---

*Al cambiar una regla de este archivo en una sesión de trabajo: actualizar la fecha arriba y dejar una línea en `DECISIONS.md` apuntando al cambio.*
