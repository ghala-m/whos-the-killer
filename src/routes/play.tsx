import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CaseBoard } from "@/components/CaseBoard";
import { RouletteWheel } from "@/components/RouletteWheel";
import { PrefToggles } from "@/components/PrefToggles";
import { caseIssues, loadCase, type CaseFile } from "@/lib/case-model";
import { initAudio, isMuted, setMuted, sfx, startSiren, stopSiren } from "@/lib/audio-fx";
import { useUi } from "@/lib/ui-prefs";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Live Investigation — Case Closed" },
      {
        name: "description",
        content:
          "Run the mystery live on the projector: suspect intros, clue reveals, countdown, a roulette draw for team order, live accusations and the culprit reveal.",
      },
      { property: "og:title", content: "Live Investigation — Case Closed" },
      {
        property: "og:description",
        content: "Suspect intros, clue reveals, a ticking countdown, a team roulette draw and a celebratory reveal.",
      },
    ],
  }),
  component: PlayPage,
});

type Phase = "intro" | "clues" | "countdown" | "roulette" | "accuse" | "reveal";
type Verdict = { kind: "correct" | "wrong"; team: string; suspectId: string } | null;

const btn =
  "rounded-sm border border-border bg-card px-5 py-3 font-display text-lg transition-colors hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed";
const btnPrimary =
  "rounded-sm bg-primary px-6 py-3 font-display text-lg text-primary-foreground transition-transform hover:-translate-y-0.5";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function PlayPage() {
  const router = useRouter();
  const { t } = useUi();
  const [c, setC] = useState<CaseFile | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [entered, setEntered] = useState(0);
  const [clueIndex, setClueIndex] = useState(0);
  const [remaining, setRemaining] = useState(60);
  const [paused, setPaused] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [revealed, setRevealed] = useState(false);
  // teams / roulette
  const [order, setOrder] = useState<string[]>([]);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [turnIndex, setTurnIndex] = useState(0);
  const [wrongPicks, setWrongPicks] = useState<Set<string>>(new Set());
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [winner, setWinner] = useState<string | null>(null);
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
    const t2 = window.setTimeout(() => {
      sfx.pop(entered);
      setEntered((n) => n + 1);
    }, 700);
    return () => window.clearTimeout(t2);
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
          setPhase("roulette");
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

  // Reveal drama (only when no team caught the killer)
  useEffect(() => {
    if (phase !== "reveal") return;
    stopSiren();
    if (winner) {
      setRevealed(true);
      sfx.fanfare();
      return;
    }
    setRevealed(false);
    sfx.drumroll(1.6);
    const t2 = window.setTimeout(() => {
      setRevealed(true);
      sfx.fanfare();
    }, 1700);
    return () => window.clearTimeout(t2);
  }, [phase, winner]);

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
    setOrder([]);
    setRotation(0);
    setSpinning(false);
    setTurnIndex(0);
    setWrongPicks(new Set());
    setVerdict(null);
    setWinner(null);
    setRevealed(false);
    sfx.sting();
  }, [c]);

  const spin = useCallback(() => {
    if (!c || spinning) return;
    setSpinning(true);
    sfx.whoosh();
    setRotation((r) => r + 1440 + Math.floor(Math.random() * 360));
    window.setTimeout(() => {
      setOrder(shuffle(c.settings.teams));
      setSpinning(false);
      sfx.fanfare();
    }, 4300);
  }, [c, spinning]);

  const pickSuspect = useCallback(
    (id: string) => {
      if (!c || verdict) return;
      const team = order[turnIndex] ?? c.settings.teams[0] ?? "Team 1";
      if (id === c.killerId) {
        setVerdict({ kind: "correct", team, suspectId: id });
        sfx.fanfare();
        setWinner(team);
        window.setTimeout(() => setPhase("reveal"), 2200);
        return;
      }
      setVerdict({ kind: "wrong", team, suspectId: id });
      sfx.slam();
      window.setTimeout(() => sfx.eliminate(), 250);
      setWrongPicks((prev) => new Set(prev).add(id));
      window.setTimeout(() => {
        setVerdict(null);
        if (turnIndex + 1 < order.length) {
          setTurnIndex((i) => i + 1);
        } else {
          setPhase("reveal");
        }
      }, 2400);
    },
    [c, order, turnIndex, verdict],
  );

  if (!c) return <main className="min-h-screen p-10 text-muted-foreground">…</main>;

  if (caseIssues(c).some((i) => i.level === "error")) {
    return (
      <main className="grid min-h-screen place-items-center p-10 text-center">
        <div>
          <h1 className="text-3xl">{t("notReady")}</h1>
          <p className="mt-2 text-muted-foreground">{t("notReadyHint")}</p>
          <button onClick={() => router.navigate({ to: "/setup" })} className={`${btnPrimary} mt-6`}>
            {t("goSetup")}
          </button>
        </div>
      </main>
    );
  }

  const killer = c.suspects.find((s) => s.id === c.killerId)!;
  const alarm = phase === "countdown" && remaining <= 20;
  const shaking = phase === "countdown" && remaining <= 10 && !paused;
  const currentTeam = order[turnIndex] ?? c.settings.teams[0] ?? "";

  return (
    <main className={`relative min-h-screen overflow-hidden px-5 py-6 ${alarm ? "anim-alarm" : "spotlight"}`}>
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <p className="font-display text-sm uppercase tracking-[0.35em] text-primary">
          {phase === "intro" && t("phase1")}
          {phase === "clues" && `${t("phase2")} ${Math.max(clueIndex, 1)} ${t("of")} ${c.clues.length}`}
          {phase === "countdown" && t("phase3")}
          {phase === "roulette" && t("phase4")}
          {phase === "accuse" && t("phase5")}
          {phase === "reveal" && t("phase6")}
        </p>
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-widest">
          <PrefToggles />
          <button
            onClick={() => {
              const next = !muted;
              setMuted(next);
              setMutedState(next);
              if (next) stopSiren();
            }}
            className="rounded-sm border border-border px-3 py-2 hover:bg-secondary"
          >
            {t("sound")} {muted ? t("off") : t("on")}
          </button>
          <button onClick={() => setConfirmExit(true)} className="rounded-sm border border-border px-3 py-2 hover:bg-secondary">
            {t("exit")}
          </button>
        </div>
      </header>

      <div className={`mx-auto mt-6 max-w-6xl ${shaking ? "anim-shake" : ""}`}>
        {phase === "intro" && (
          <section className="text-center">
            <div className="anim-slam paper mx-auto w-72 rounded-sm p-5">
              <p className="text-xs uppercase tracking-[0.4em]">{t("victimLabel")}</p>
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
              <p className="text-sm opacity-70">{t("foundAtScene")}</p>
            </div>
            <h2 className="mt-8 text-3xl">{t("theSuspects")}</h2>
            <div className="mt-4">
              <CaseBoard suspects={c.suspects} eliminated={eliminated} revealedCount={entered} />
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={() => setEntered(c.suspects.length)} className={btn} disabled={entered >= c.suspects.length}>
                {t("showAll")}
              </button>
              <button
                className={btnPrimary}
                onClick={() => {
                  sfx.whoosh();
                  setPhase("clues");
                }}
              >
                {t("begin")}
              </button>
            </div>
          </section>
        )}

        {phase === "clues" && (
          <section className="text-center">
            <div className="min-h-40">
              {clueIndex === 0 ? (
                <p className="mt-10 text-xl text-muted-foreground">{t("noCluesYet")}</p>
              ) : (
                <article key={c.clues[clueIndex - 1]?.id} className="anim-slam paper mx-auto max-w-3xl rounded-sm p-6">
                  <p className="text-xs uppercase tracking-[0.4em]">
                    {t("clue")} {clueIndex}
                  </p>
                  <p className="mt-3 font-display text-2xl leading-snug">{c.clues[clueIndex - 1]?.text}</p>
                </article>
              )}
            </div>
            <div className="mt-8">
              <CaseBoard suspects={c.suspects} eliminated={eliminated} />
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button className={btn} disabled={clueIndex === 0} onClick={() => setClueIndex((i) => Math.max(0, i - 1))}>
                {t("previous")}
              </button>
              {clueIndex < c.clues.length ? (
                <button
                  className={btnPrimary}
                  onClick={() => {
                    sfx.slam();
                    const nextClue = c.clues[clueIndex];
                    if (nextClue?.eliminates.length) window.setTimeout(() => sfx.eliminate(), 350);
                    setClueIndex((i) => i + 1);
                  }}
                >
                  {t("revealNext")}
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
                  {t("toCountdown")}
                </button>
              )}
              <span className="font-display text-sm uppercase tracking-widest text-muted-foreground">
                {t("clue")} {clueIndex} {t("of")} {c.clues.length}
              </span>
            </div>
          </section>
        )}

        {phase === "countdown" && (
          <section className="text-center">
            <h2 className="text-3xl">{t("makeAccusation")}</h2>
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
                {paused ? t("resume") : t("pause")}
              </button>
              <button
                className={btnPrimary}
                onClick={() => {
                  stopSiren();
                  setPhase("roulette");
                }}
              >
                {t("skipToDraw")}
              </button>
            </div>
          </section>
        )}

        {phase === "roulette" && (
          <section className="text-center">
            <h2 className="text-3xl">{t("spinTitle")}</h2>
            <div className="mt-6">
              <RouletteWheel teams={c.settings.teams} rotation={rotation} spinning={spinning} />
            </div>
            {order.length > 0 && (
              <ol className="anim-verdict mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-3">
                {order.map((team, i) => (
                  <li key={`${team}-${i}`} className="rounded-sm border border-brass bg-card px-4 py-2 font-display text-lg">
                    <span className="text-brass">{i + 1}.</span> {team}
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button className={btnPrimary} onClick={spin} disabled={spinning}>
                {spinning ? t("spinning") : t("spin")}
              </button>
              <button
                className={btn}
                disabled={order.length === 0 || spinning}
                onClick={() => {
                  setTurnIndex(0);
                  setPhase("accuse");
                }}
              >
                {t("startAccusations")}
              </button>
            </div>
          </section>
        )}

        {phase === "accuse" && (
          <section className="relative text-center">
            <h2 className="text-3xl">
              {t("turnOf")} <span className="text-brass">{currentTeam}</span>
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">{t("pickSuspect")}</p>
            <div className="mt-6">
              <CaseBoard
                suspects={c.suspects}
                eliminated={eliminated}
                accused={wrongPicks}
                onPick={pickSuspect}
                pickable={!verdict}
              />
            </div>
            <ol className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm uppercase tracking-widest">
              {order.map((team, i) => (
                <li
                  key={`${team}-${i}`}
                  className={`rounded-full border px-3 py-1 ${
                    i === turnIndex ? "border-brass bg-brass/15 text-brass" : i < turnIndex ? "opacity-40" : "border-border"
                  }`}
                >
                  {team}
                </li>
              ))}
            </ol>

            {verdict && (
              <div className="fixed inset-0 z-50 grid place-items-center bg-background/85 px-6">
                <div className={`anim-verdict text-center ${verdict.kind === "wrong" ? "anim-buzz" : ""}`}>
                  <p
                    className={`font-display leading-none ${verdict.kind === "correct" ? "text-brass" : "text-destructive"}`}
                    style={{ fontSize: "clamp(3rem, 12vw, 9rem)" }}
                  >
                    {verdict.kind === "correct" ? `✓ ${t("correct")}` : `${t("wrong")}`}
                  </p>
                  <p className="mt-4 font-display text-2xl">
                    {verdict.kind === "correct" ? `${verdict.team} — ${t("caught")}` : `${verdict.team} · ${t("passing")}`}
                  </p>
                </div>
                {verdict.kind === "correct" && <Confetti />}
              </div>
            )}
          </section>
        )}

        {phase === "reveal" && (
          <section className="relative text-center">
            {revealed && winner && <Confetti />}
            <h2 className="text-3xl">{revealed ? t("culpritIs") : t("drumroll")}</h2>
            {winner ? (
              <p className="mt-3 font-display text-2xl text-brass">
                🏆 {winner} — {t("caught")}
              </p>
            ) : (
              revealed && <p className="mt-3 font-display text-2xl text-destructive">{t("noWinner")}</p>
            )}
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
                <p className="mt-3 font-display text-lg text-evidence">
                  {t("guiltyOf")} {c.victim.name}
                </p>
              </div>
            ) : (
              <p className="mt-16 font-display text-6xl text-brass">?</p>
            )}
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <button className={btnPrimary} onClick={restart}>
                {t("playAgain")}
              </button>
              <button className={btn} onClick={() => router.navigate({ to: "/" })}>
                {t("mainMenu")}
              </button>
            </div>
          </section>
        )}
      </div>

      {confirmExit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/85 px-6">
          <div className="max-w-sm rounded-lg border border-border bg-card p-6 text-center">
            <h2 className="text-2xl">{t("exit")}?</h2>
            <div className="mt-5 flex justify-center gap-3">
              <button
                className={btnPrimary}
                onClick={() => {
                  stopSiren();
                  router.navigate({ to: "/" });
                }}
              >
                {t("mainMenu")}
              </button>
              <button className={btn} onClick={() => setConfirmExit(false)}>
                {t("resume")}
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
