# 🔍 Who's the Killer?

A projector-ready **classroom murder-mystery game**. One screen, one culprit, and a room full of detectives racing to crack the case.

> **مَن القاتل؟** — لعبة غموض صفّية تُعرض على شاشة العرض. شاشة واحدة، قاتل واحد، وغرفة مليئة بالمحققين يتسابقون على حل القضية.

![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-8A2BE2)

---

## 🎮 What is this?

**Who's the Killer?** turns any classroom into a live detective investigation. A teacher (the "game master") sets up a custom murder case — a victim, a set of suspects, and a trail of clues — then runs the game on the projector while teams of students compete to be the first to name the culprit.

The game runs entirely in the browser. There's no backend, no login, and no installation — just open it and play. Cases are saved locally so you can reuse them anytime.

### Why it's fun

- **It's a mystery, not a quiz.** Clues are revealed one at a time. Suspects are never visually "crossed out" during the investigation — students must reason through the clues themselves. The mystery stays unsolved until the final reveal.
- **It's competitive.** Multiple teams race to catch the killer. Their answering order is drawn at random by a spinning **roulette wheel**.
- **It's theatrical.** Procedural sound effects (stingers, sirens, drumrolls, fanfares), a noir detective aesthetic, a countdown timer, and a dramatic reveal make it feel like a real whodunit.

---

## 🕹️ How a game plays out

The game flows through six phases on a single screen:

| Phase | What happens |
|-------|--------------|
| **1 — The Scene** | The victim is introduced. Suspects "drop in" one by one onto a corkboard. |
| **2 — The Clues** | Clues are revealed one at a time. Each clue clears some suspects — but no marks are shown, so teams must deduce who's left. |
| **3 — Final Countdown** | A timer ticks down while teams discuss and decide who the culprit is. |
| **4 — Draw the Order** | A spinning roulette wheel randomly sets the order in which teams will make their accusation. |
| **5 — The Accusation** | Each team, in turn, taps the suspect they accuse. A graphic flashes **CORRECT!** or **WRONG!**. A wrong answer passes the turn to the next team. |
| **6 — The Reveal** | The culprit is dramatically unmasked, and the winning team is celebrated. |

---

## 🛠️ Features

- **🌍 Bilingual** — full **English** and **العربية** support, with automatic RTL layout for Arabic.
- **🌗 Dark & Light themes** — switchable in real time from the header.
- **📝 Custom cases** — build your own victim, suspects, clues, and culprit in the Case Setup screen, or load the included sample case.
- **🎲 Competing teams** — define any number of teams; their answering order is drawn by a roulette wheel.
- **🔫 Click-to-accuse** — in the final phase, teams tap the suspect they want to accuse, with instant correct/wrong feedback.
- **🔊 Procedural audio** — all sound effects are synthesized live with the Web Audio API (no audio files needed). Toggle sound on/off anytime.
- **💾 Local persistence** — cases and preferences (language, theme) are saved in the browser, so everything is ready next time you open the site.
- **🖼️ Projector-first design** — large, high-contrast visuals built for a big screen at the front of a classroom.

---

## 🧱 Built with

- [**TanStack Start**](https://tanstack.com/start) — full-stack React 19 framework (SSR/SSG, file-based routing)
- [**React 19**](https://react.dev/) + [**TypeScript**](https://www.typescriptlang.org/)
- [**Tailwind CSS v4**](https://tailwindcss.com/) — styling with custom noir design tokens
- [**Web Audio API**](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — synthesized sound effects
- [**localStorage**](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) — case & preference persistence

No database, no server, no external accounts — the whole game runs client-side.

---

## 🚀 Run it locally

You'll need [Node.js](https://nodejs.org/) (install via [nvm](https://github.com/nvm-sh/nvm) recommended) and [npm](https://www.npmjs.com/).

```sh
git clone <this-repository-url>
cd <repository-name>
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:8080`).

### Other scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format the codebase with Prettier |

---

## 📂 Project structure

```
src/
├── routes/
│   ├── index.tsx        # Home screen — scattered "case file" menu
│   ├── setup.tsx        # Case Setup — build/edit the mystery
│   └── play.tsx         # Live game — the six-phase investigation
├── components/
│   ├── CaseBoard.tsx     # Suspect corkboard & suspect cards
│   ├── RouletteWheel.tsx # SVG roulette wheel for team order
│   └── PrefToggles.tsx   # Language & theme toggles
├── lib/
│   ├── case-model.ts    # Case data model, validation, storage
│   ├── ui-prefs.tsx     # Bilingual (EN/AR) + theme provider
│   └── audio-fx.ts      # Procedural Web Audio sound effects
└── styles.css           # Noir theme tokens, paper textures, animations
```

---

## 🎨 Design notes

The visual language is a **1940s noir detective** aesthetic: corkboard textures, aged-paper cards, brass accents, typewriter fonts, and a spotlight vignette. The home screen is styled as a **scattered case file** — a tilted folder sitting atop stacked pages, with pinned paper scraps (suspect/clue/team counts) and a victim polaroid strewn around it. On phones, the scraps stack neatly above the folder so nothing is lost.

---

## 📄 License

This project is yours to use, modify, and share. See the repository for terms.

---

Built with [Lovable](https://lovable.dev).
