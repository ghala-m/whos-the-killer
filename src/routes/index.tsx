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

  return (
    <main className="spotlight relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-14">
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
        style={{ background: "radial-gradient(ellipse at 50% 120%, oklch(0 0 0 / 0.75), transparent 65%)" }}
      />

      <div className="fixed top-4 end-4 z-20">
        <PrefToggles />
      </div>

      {/* case folder */}
      <section className="relative z-10 w-full max-w-3xl">
        <div className="mx-auto w-fit -mb-px rounded-t-md border border-b-0 border-brass/40 bg-brass/15 px-6 py-1.5 font-display text-[0.7rem] uppercase tracking-[0.45em] text-brass">
          {t("caseNo")}
        </div>

        <div className="rounded-md border border-brass/30 bg-card/70 p-8 text-center shadow-noir backdrop-blur-sm sm:p-12">
          <div className="mx-auto mb-6 flex items-center justify-center gap-3 text-brass/60">
            <span className="h-px w-16 bg-current" />
            <span className="font-display text-xs uppercase tracking-[0.35em]">🔍</span>
            <span className="h-px w-16 bg-current" />
          </div>

          <h1 className="anim-flicker text-5xl leading-[0.95] sm:text-7xl">{t("brand")}</h1>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">{t("tagline")}</p>

          {caseFile && (
            <dl className="mx-auto mt-8 grid max-w-lg grid-cols-3 gap-3 border-y border-border/60 py-4">
              {[
                [caseFile.suspects.length, t("suspects")],
                [caseFile.clues.length, t("clues")],
                [caseFile.settings.teams.length, t("teams")],
              ].map(([n, label]) => (
                <div key={String(label)}>
                  <dt className="font-display text-3xl text-brass tabular-nums">{n}</dt>
                  <dd className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</dd>
                </div>
              ))}
            </dl>
          )}

          {caseFile && (
            <p className="mt-4 font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
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
            >
              {t("start")}
            </button>
            <Link
              to="/setup"
              className="rounded-sm border border-border bg-secondary/40 px-10 py-4 font-display text-xl uppercase tracking-[0.15em] transition-colors hover:bg-secondary"
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
      </section>
    </main>
  );
}
