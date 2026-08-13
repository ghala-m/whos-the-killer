import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CaseBoard } from "@/components/CaseBoard";
import { caseIssues, loadCase, type CaseFile } from "@/lib/case-model";
import { initAudio, isMuted, setMuted, sfx, startSiren, stopSiren } from "@/lib/audio-fx";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Live Investigation — Case Closed" },
      {
        name: "description",
        content: "Run the four-phase mystery live on the projector: suspect intros, clue reveals, final countdown and the culprit reveal.",
      },
      { property: "og:title", content: "Live Investigation — Case Closed" },
      { property: "og:description", content: "Suspect intros, clue-by-clue eliminations, a ticking countdown and a celebratory reveal." },
    ],
  }),
  component: PlayPage,
});

type Phase = "intro" | "clues" | "countdown" | "reveal";

const btn =
  "rounded-sm border border-border bg-card px-5 py-3 font-display text-lg transition-colors hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed";
const btnPrimary =
  "rounded-sm bg-primary px-6 py-3 font-display text-lg text-primary-foreground transition-transform hover:-translate-y-0.5";

function PlayPage() {
  const router = useRouter();
  const [c, setC] = useState<CaseFile | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [entered, setEntered] = useState(0);
  const [clueIndex, setClueIndex] = useState(0); // clues revealed
  const [remaining, setRemaining] = useState(60);
  const [paused, setPaused] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    const loaded = loadCase();
    setC(loaded);
    setRemaining(loaded.settings.countdownSeconds);
    setMutedState(isMuted());
    initAudio();
    sfx.sting();
  }, []);

  // Phase 1 staggered suspect entrances
  useEffect(() => {
    if (!c || phase !== "intro") return;
    if (entered >= c.suspects.length) return;
    const t = window.setTimeout(() => {
      sfx.pop(entered);
      setEntered((n) => n + 1);
    }, 700);
    return () => window.clearTimeout(t);
  }, [c, phase, entered]);

  // Phase 3 countdown
  useEffect(() => {
    if (phase !== "countdown" || paused) return;
    startSiren();
    tickRef.current = window.setInterval(() => {
      setRemaining((r) => {
        const next = r - 1;
        if (next >= 0) sfx.tick(next <= 10);
        if (next <= 0) {
          stopSiren();
          setPhase("reveal");
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      stopSiren();
    };
  }, [phase, paused]);

  // Phase 4 reveal drama
  useEffect(() => {
    if (phase !== "reveal") return;
    stopSiren();
    setRevealed(false);
    sfx.drumroll(1.6);
    const t = window.setTimeout(() => {
      setRevealed(true);
      sfx.fanfare();
    }, 1700);
    return () => window.clearTimeout(t);
  }, [phase]);

  const eliminated = useMemo(() => {
    const set = new Set<string>();
    if (!c) return set;
    c.clues.slice(0, clueIndex).forEach((cl) => cl.eliminates.forEach((id) => set.add(id)));
    return set;
  }, [c, clueIndex]);

  const restart = useCallback(() => {
    if (!c) return;
    stopSiren();
    setPhase("intro");
    setEntered(0);
    setClueIndex(0);
    setRemaining(c.settings.countdownSeconds);
    setPaused(false);
    sfx.sting();
  }, [c]);

  if (!c) return <main className="min-h-screen p-10 text-muted-foreground">Loading case…</main>;

  if (caseIssues(c).some((i) => i.level === "error")) {
    return (
      <main className="grid min-h-screen place-items-center p-10 text-center">
        <div>
          <h1 className="text-3xl">This case isn't ready</h1>
          <p className="mt-2 text-muted-foreground">Finish setup before running the game.</p>
          <button onClick={() => router.navigate({ to: "/setup" })} className={`${btnPrimary} mt-6`}>
            Go to Case Setup
          </button>
        </div>
      </main>
    );
  }

  const killer = c.suspects.find((s) => s.id === c.killerId)!;
  const alarm = phase === "countdown" && remaining <= 20;
  const shaking = phase === "countdown" && remaining <= 10 && !paused;

  return (
    <main className={`relative min-h-screen overflow-hidden px-5 py-6 ${alarm ? "anim-alarm" : "spotlight"}`}>
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <p className="font-display text-sm uppercase tracking-[0.35em] text-primary">
          {phase === "intro" && "Phase 1 — The Scene"}
          {phase === "clues" && `Phase 2 — Clue ${Math.max(clueIndex, 1)} of ${c.clues.length}`}
          {phase === "countdown" && "Phase 3 — Final Countdown"}
          {phase === "reveal" && "Phase 4 — The Reveal"}
        </p>
        <div className="flex gap-2 text-xs uppercase tracking-widest">
          <button
            onClick={() => {
              const next = !muted;
              setMuted(next);
              setMutedState(next);
              if (next) stopSiren();
            }}
            className="rounded-sm border border-border px-3 py-2 hover:bg-secondary"
          >
            Sound {muted ? "off" : "on"}
          </button>
          <button onClick={() => setConfirmExit(true)} className="rounded-sm border border-border px-3 py-2 hover:bg-secondary">
            Exit
          </button>
        </div>
      </header>

      <div className={`mx-auto mt-6 max-w-6xl ${shaking ? "anim-shake" : ""}`}>
        {phase === "intro" && (
          <section className="text-center">
            <div className="anim-slam paper mx-auto w-72 rounded-sm p-5">
              <p className="text-xs uppercase tracking-[0.4em]">Victim</p>
              <div className="mt-2 text-7xl">
                {c.victim.avatar.startsWith("data:") ? (
                  <img src={c.victim.avatar} alt={c.victim.name} className="mx-auto h-28 w-full object-cover" />
                ) : (
                  <span role="img" aria-label={c.victim.name}>
                    {c.victim.avatar}
                  </span>
                )}
              </div>
              <h1 className="mt-2 text-2xl">{c.victim.name}</h1>
              <p className="text-sm opacity-70">Found at the scene. No witnesses.</p>
            </div>
            <h2 className="mt-8 text-3xl">The Suspects</h2>
            <div className="mt-4">
              <CaseBoard suspects={c.suspects} eliminated={eliminated} revealedCount={entered} />
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={() => setEntered(c.suspects.length)} className={btn} disabled={entered >= c.suspects.length}>
                Show all
              </button>
              <button
                className={btnPrimary}
                onClick={() => {
                  sfx.whoosh();
                  setPhase("clues");
                }}
              >
                Begin Investigation
              </button>
            </div>
          </section>
        )}

        {phase === "clues" && (
          <section className="text-center">
            <div className="min-h-40">
              {clueIndex === 0 ? (
                <p className="mt-10 text-xl text-muted-foreground">No clues yet. Reveal the first one.</p>
              ) : (
                <article key={c.clues[clueIndex - 1].id} className="anim-slam paper mx-auto max-w-3xl rounded-sm p-6">
                  <p className="text-xs uppercase tracking-[0.4em]">Clue {clueIndex}</p>
                  <p className="mt-3 font-display text-2xl leading-snug">{c.clues[clueIndex - 1].text}</p>
                </article>
              )}
            </div>
            <div className="mt-8">
              <CaseBoard suspects={c.suspects} eliminated={eliminated} />
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button className={btn} disabled={clueIndex === 0} onClick={() => setClueIndex((i) => Math.max(0, i - 1))}>
                Previous
              </button>
              {clueIndex < c.clues.length ? (
                <button
                  className={btnPrimary}
                  onClick={() => {
                    sfx.slam();
                    const nextClue = c.clues[clueIndex];
                    if (nextClue.eliminates.length) window.setTimeout(() => sfx.eliminate(), 350);
                    setClueIndex((i) => i + 1);
                  }}
                >
                  Reveal Next Clue
                </button>
              ) : (
                <button
                  className={btnPrimary}
                  onClick={() => {
                    setRemaining(c.settings.countdownSeconds);
                    setPaused(false);
                    setPhase("countdown");
                  }}
                >
                  Proceed to Final Countdown
                </button>
              )}
              <span className="font-display text-sm uppercase tracking-widest text-muted-foreground">
                Clue {clueIndex} of {c.clues.length}
              </span>
            </div>
          </section>
        )}

        {phase === "countdown" && (
          <section className="text-center">
            <h2 className="text-3xl">Make your accusation</h2>
            <p
              className={`mt-4 font-display leading-none tabular-nums ${remaining <= 10 ? "text-destructive" : "text-brass"}`}
              style={{ fontSize: "clamp(6rem, 22vw, 18rem)" }}
              aria-live="polite"
            >
              {String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}
            </p>
            <div className="mt-2">
              <CaseBoard suspects={c.suspects} eliminated={eliminated} />
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button className={btn} onClick={() => setPaused((p) => !p)}>
                {paused ? "Resume" : "Pause"}
              </button>
              <button
                className={btnPrimary}
                onClick={() => {
                  stopSiren();
                  setPhase("reveal");
                }}
              >
                Skip to Reveal
              </button>
            </div>
          </section>
        )}

        {phase === "reveal" && (
          <section className="relative text-center">
            {revealed && <Confetti />}
            <h2 className="text-3xl">{revealed ? "The culprit is…" : "Drumroll…"}</h2>
            {revealed ? (
              <div className="anim-reveal paper mx-auto mt-6 w-80 rounded-sm p-6">
                <div className="text-8xl">
                  {killer.avatar.startsWith("data:") ? (
                    <img src={killer.avatar} alt={killer.name} className="mx-auto h-36 w-full object-cover" />
                  ) : (
                    <span role="img" aria-label={killer.name}>
                      {killer.avatar}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-3xl">{killer.name}</h3>
                <p className="text-sm uppercase tracking-widest opacity-70">{killer.role}</p>
                <p className="mt-3 font-display text-lg text-evidence">Guilty of the murder of {c.victim.name}</p>
              </div>
            ) : (
              <p className="mt-16 font-display text-6xl text-brass">?</p>
            )}
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <button className={btnPrimary} onClick={restart}>
                Play again
              </button>
              <button className={btn} onClick={() => router.navigate({ to: "/" })}>
                Main menu
              </button>
            </div>
          </section>
        )}
      </div>

      {confirmExit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/85 px-6">
          <div className="max-w-sm rounded-lg border border-border bg-card p-6 text-center">
            <h2 className="text-2xl">End this round?</h2>
            <p className="mt-2 text-sm text-muted-foreground">Leaving now ends the investigation for the room.</p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                className={btnPrimary}
                onClick={() => {
                  stopSiren();
                  router.navigate({ to: "/" });
                }}
              >
                Exit to menu
              </button>
              <button className={btn} onClick={() => setConfirmExit(false)}>
                Keep playing
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.5,
        duration: 2.5 + Math.random() * 2,
        color: ["var(--brass)", "var(--evidence)", "var(--primary)", "oklch(0.93 0.03 85)"][i % 4],
        size: 6 + Math.random() * 8,
      })),
    [],
  );
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 block rounded-[1px]"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.8,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
