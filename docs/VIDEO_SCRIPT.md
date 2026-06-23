# LinkedIn Showcase — Video Script

A ~75-second demo script for recording and narrating the 3D Chess project.
Two voice options per scene: **Spoken** (read aloud) and **Caption** (on-screen
text if you'd rather not talk). Times are cumulative targets.

---

## Before you record

- Run the production build, not the dev server (cleaner, no FPS title flicker):
  ```bash
  npm run build && npm run preview
  ```
  Open the printed `localhost` URL in a maximized browser window.
- Hide bookmarks bar / notifications. Use a clean browser profile.
- Record at **1080p**, 30fps. Tools: OBS Studio (free), or the built-in
  Windows Game Bar (`Win + G`).
- Have one short game planned so you can reach a **checkmate** quickly
  (e.g. Scholar's Mate as White vs Easy AI: e4, Bc4, Qh5, Qxf7#).
- Keep total length **under 90s** — LinkedIn autoplays muted, so the on-screen
  captions matter as much as the voice.

---

## Scene 1 — Hook (0:00 – 0:08)

**On screen:** The mode-selection overlay (the title screen). Slowly orbit
nothing yet — just let the "♟ Chess / Choose your game mode" screen sit, mouse
hovering between the two cards.

- **Spoken:** "I built a full 3D chess game that runs entirely in the browser —
  no backend, no game engine, just JavaScript and Three.js."
- **Caption:** `3D Chess in the browser — Three.js + vanilla JS, no backend`

---

## Scene 2 — The board & pieces (0:08 – 0:20)

**On screen:** Click **vs AI**, pick **Easy**. When the board loads, drag to
orbit the camera around it. Zoom in on a couple of pieces.

- **Spoken:** "The pieces aren't just blocks — each one is lathe-turned in code,
  like real chess pieces, with a procedural wood-grain texture and a lacquered
  finish. Boxwood for white, walnut for black."
- **Caption:** `Lathe-turned geometry + procedural wood textures (PBR)`

---

## Scene 3 — Playing & animations (0:20 – 0:35)

**On screen:** Click a pawn — highlights show legal moves. Make a move; let the
piece glide. Make a capture so the captured piece scales-and-fades out. Point at
the HUD updating (turn indicator, captured pieces, move history).

- **Spoken:** "Every rule is enforced — legal moves, checks, castling, en
  passant, promotion. Moves animate with a smooth arc, captures fade out, and
  the HUD tracks turns, captured pieces, and full move history."
- **Caption:** `Full rules (chess.js) · animated moves · live HUD`

---

## Scene 4 — The AI (0:35 – 0:52)

**On screen:** Open the in-game **AI Difficulty** dropdown, switch to **Hard**.
Make a move and let the AI respond — emphasize that the board stays smooth /
orbit-able while it "thinks."

- **Spoken:** "The AI uses alpha-beta minimax with three difficulty levels. The
  hard setting searches four moves deep — and because that runs in a Web Worker,
  off the main thread, the interface never freezes while it's thinking."
- **Caption:** `Alpha-beta minimax AI — runs in a Web Worker, zero UI lag`

---

## Scene 5 — PvP camera flip (0:52 – 1:02)

**On screen:** (Optional but impressive.) Restart, pick **vs Human**, make a
move — the camera smoothly swings 180° to the other player's side.

- **Spoken:** "In two-player mode, the camera smoothly flips to the other side
  after each move, so pass-and-play feels natural."
- **Caption:** `Pass-and-play: camera flips 180° each turn`

---

## Scene 6 — Win + wrap (1:02 – 1:15)

**On screen:** Deliver checkmate. The "Wins!" game-over screen appears. Click
**Play Again** to show the instant restart.

- **Spoken:** "Checkmate detection ends the game, and Play Again restarts
  instantly. The whole thing is built with Vite and deployed free on GitHub
  Pages. Link's in the comments — would love your feedback."
- **Caption:** `Checkmate detection · instant restart · live on GitHub Pages`

---

## On-screen end card (last 3s)

Freeze on the board with text overlay:

```
3D Chess ♟
Three.js · chess.js · Web Workers · Vite
Live demo + code → link in comments
```

---

## LinkedIn post caption (copy-paste)

> ♟️ I built a 3D chess game that runs entirely in the browser — and I'm pretty
> happy with how it turned out.
>
> What's under the hood:
> • Three.js for real-time 3D rendering — pieces are lathe-turned in code with
>   procedural wood textures
> • chess.js for bulletproof rule enforcement (castling, en passant, promotion,
>   checkmate)
> • An alpha-beta minimax AI with Easy / Medium / Hard levels
> • The hard AI runs in a Web Worker, so deep search never freezes the UI
> • Smooth move/capture animations and a 180° camera flip for pass-and-play
> • Built with Vite, deployed free on GitHub Pages
>
> No backend, no game engine — just JavaScript. It was a great reminder of how
> much you can ship with the web platform alone.
>
> 🔗 Live demo + source code in the comments. Feedback welcome!
>
> #JavaScript #ThreeJS #WebGL #WebDevelopment #Frontend #GameDev #BuildInPublic

**First comment (put links here, not in the post — better reach):**

> Live demo: https://ifahimkhan.github.io/ChessGame/
> Code: https://github.com/ifahimkhan/ChessGame

---

## Tips for a strong post

- Upload the video **natively** to LinkedIn (don't link to YouTube) — native
  video gets far more reach.
- Put links in the **first comment**, not the post body — LinkedIn suppresses
  posts with external links.
- Add **captions** (on-screen text or a subtitle file) — most people watch muted.
- Post Tue–Thu morning for best engagement; reply to early comments quickly.
