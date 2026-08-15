import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { caseIssues, loadCase, SAMPLE_CASE, saveCase, type CaseFile } from "@/lib/case-model";
import { initAudio, isMuted, setMuted, sfx } from "@/lib/audio-fx";
import { useUi } from "@/lib/ui-prefs";
import { PrefToggles } from "@/components/PrefToggles";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Who's the Killer? — Classroom Mystery Game" },
      {
        name: "description",
        content:
          "Run a dramatic murder-mystery game on your classroom projector. Custom suspects and clues, competing teams, a roulette draw and a big reveal.",
      },
      { property: "og:title", content: "Who's the Killer? — Classroom Mystery Game" },
      {
        property: "og:description",
        content: "Custom suspects, clue-by-clue eliminations, team roulette draw, live accusations and a big reveal.",
      },
    ],
  }),
  component: MainMenu,
});

function MainMenu() {
  const router = useRouter();
  const { t } = useUi();
  const [caseFile, setCaseFile] = useState<CaseFile | null>(null);
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setCaseFile(loadCase());
    setMutedState(isMuted());
  }, []);

  const issues = caseFile ? caseIssues(caseFile) : [];
  const blocking = issues.filter((i) => i.level === "error");
  const ready = !!caseFile && blocking.length === 0;

  const scraps = caseFile
    ? [
        { n: caseFile.suspects.length, label: t("suspects"), rot: -7, cls: "lg:absolute lg:-left-6 lg:top-10" },
        { n: caseFile.clues.length, label: t("clues"), rot: 5, cls: "lg:absolute lg:-right-10 lg:top-24" },
        { n: caseFile.settings.teams.length, label: t("teams"), rot: -4, cls: "lg:absolute lg:-left-2 lg:bottom-6" },
      ]
    : [];

  return (
    <main className="corkboard spotlight relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      {/* ambient noir layers */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          background:
            "repeating-linear-gradient(115deg, oklch(1 0 0 / 0.025) 0 1px, transparent 1px 42px)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 120%, oklch(0 0 0 / 0.8), transparent 65%)" }}
      />

      <div className="fixed top-4 end-4 z-20">
        <PrefToggles />
      </div>

      {/* scattered case file */}
      <section className="relative z-10 w-full max-w-4xl">
        {/* stray scraps */}
        <div className="pointer-events-none relative mb-6 flex flex-wrap items-center justify-center gap-4 lg:mb-0 lg:block">
          {scraps.map((s) => (
            <div
              key={String(s.label)}
              className={`paper anim-drop w-24 rounded-[2px] px-3 py-2 text-center ${s.cls}`}
              style={{ transform: `rotate(${s.rot}deg)` }}
            >
              <div className="font-display text-2xl tabular-nums">{s.n}</div>
              <div className="text-[0.6rem] uppercase tracking-[0.18em] opacity-70">{s.label}</div>
            </div>
          ))}

          <div
            className="paper anim-drop hidden w-40 rounded-[2px] p-2 lg:absolute lg:-right-16 lg:bottom-2 lg:block"
            style={{ transform: "rotate(7deg)" }}
          >
            <div className="flex h-24 items-center justify-center bg-ink/85 text-4xl">
              {caseFile?.victim.avatar?.startsWith("data:") ? "🦆" : caseFile?.victim.avatar ?? "❓"}
            </div>
            <div className="pt-2 text-center font-display text-[0.65rem] uppercase tracking-[0.2em]">
              {caseFile?.victim.name}
            </div>
          </div>
        </div>

        {/* the folder */}
        <div className="relative" style={{ transform: "rotate(-1.2deg)" }}>
          {/* stacked pages behind */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-md border border-brass/20 bg-card/50"
            style={{ transform: "rotate(2.4deg)" }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-md border border-brass/20 bg-card/60"
            style={{ transform: "rotate(-2deg)" }}
          />

          <div className="relative mx-auto w-fit -mb-px rounded-t-md border border-b-0 border-brass/40 bg-brass/15 px-6 py-1.5 font-display text-[0.7rem] uppercase tracking-[0.45em] text-brass">
            {t("caseNo")}
          </div>

          <div className="relative rounded-md border border-brass/30 bg-card/85 p-8 text-center shadow-noir backdrop-blur-sm sm:p-12">
            {/* tape strips */}
            <span
              aria-hidden="true"
              className="absolute -top-3 left-8 h-6 w-24 bg-foreground/10 shadow-sm"
              style={{ transform: "rotate(-6deg)" }}
            />
            <span
              aria-hidden="true"
              className="absolute -bottom-3 right-10 h-6 w-20 bg-foreground/10 shadow-sm"
              style={{ transform: "rotate(4deg)" }}
            />

            <div className="mx-auto mb-6 flex items-center justify-center gap-3 text-brass/60">
              <span className="h-px w-16 bg-current" />
              <span className="font-display text-xs uppercase tracking-[0.35em]">🔍</span>
              <span className="h-px w-16 bg-current" />
            </div>

            <h1 className="anim-flicker text-5xl leading-[0.95] sm:text-7xl">{t("brand")}</h1>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">{t("tagline")}</p>

            {caseFile && (
              <p className="mt-6 font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
                {t("currentCase")}:{" "}
                <span className="text-foreground">
                  {caseFile.victim.avatar.startsWith("data:") ? "🦆" : caseFile.victim.avatar} {caseFile.victim.name}
                </span>
              </p>
            )}

            {blocking.length > 0 && (
              <ul className="mt-5 space-y-1 text-sm text-destructive">
                {blocking.map((i) => (
                  <li key={i.message}>{i.message}</li>
                ))}
              </ul>
            )}

            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <button
                disabled={!ready}
                onClick={() => {
                  initAudio();
                  sfx.sting();
                  router.navigate({ to: "/play" });
                }}
                className="rounded-sm bg-primary px-10 py-4 font-display text-xl uppercase tracking-[0.15em] text-primary-foreground shadow-noir transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ transform: "rotate(-0.8deg)" }}
              >
                {t("start")}
              </button>
              <Link
                to="/setup"
                className="rounded-sm border border-border bg-secondary/40 px-10 py-4 font-display text-xl uppercase tracking-[0.15em] transition-colors hover:bg-secondary"
                style={{ transform: "rotate(1deg)" }}
              >
                {t("setup")}
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-xs">
              <button
                onClick={() => {
                  saveCase(SAMPLE_CASE);
                  setCaseFile(SAMPLE_CASE);
                }}
                className="rounded-full border border-border/70 px-4 py-2 uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-brass hover:text-brass"
              >
                {t("loadSample")}
              </button>
              <button
                onClick={() => {
                  const next = !muted;
                  setMuted(next);
                  setMutedState(next);
                }}
                className="rounded-full border border-border/70 px-4 py-2 uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-brass hover:text-brass"
              >
                {t("sound")}: {muted ? t("off") : t("on")}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

