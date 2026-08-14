import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { caseIssues, loadCase, SAMPLE_CASE, saveCase, type CaseFile } from "@/lib/case-model";
import { initAudio, isMuted, setMuted, sfx } from "@/lib/audio-fx";
import { useUi } from "@/lib/ui-prefs";
import { PrefToggles } from "@/components/PrefToggles";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Case Closed — Classroom Mystery Game" },
      {
        name: "description",
        content:
          "Run a dramatic murder-mystery game on your classroom projector. Custom suspects and clues, competing teams, a roulette draw and a big reveal.",
      },
      { property: "og:title", content: "Case Closed — Classroom Mystery Game" },
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
    <main className="spotlight flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <div className="fixed top-4 end-4">
        <PrefToggles />
      </div>
      <p className="font-body text-sm uppercase tracking-[0.5em] text-primary">{t("caseNo")}</p>
      <h1 className="anim-flicker mt-4 text-6xl leading-none sm:text-8xl">{t("brand")}</h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">{t("tagline")}</p>

      {caseFile && (
        <p className="mt-6 font-display text-base text-brass">
          {t("currentCase")}: {caseFile.victim.avatar.startsWith("data:") ? "🦆" : caseFile.victim.avatar}{" "}
          {caseFile.victim.name} · {caseFile.suspects.length} {t("suspects")} · {caseFile.clues.length} {t("clues")} ·{" "}
          {caseFile.settings.teams.length} {t("teams")}
        </p>
      )}

      {blocking.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-destructive">
          {blocking.map((i) => (
            <li key={i.message}>{i.message}</li>
          ))}
        </ul>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button
          disabled={!ready}
          onClick={() => {
            initAudio();
            sfx.sting();
            router.navigate({ to: "/play" });
          }}
          className="rounded-sm bg-primary px-8 py-4 font-display text-xl text-primary-foreground shadow-noir transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("start")}
        </button>
        <Link
          to="/setup"
          className="rounded-sm border border-border bg-card px-8 py-4 font-display text-xl transition-colors hover:bg-secondary"
        >
          {t("setup")}
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
        <button
          onClick={() => {
            saveCase(SAMPLE_CASE);
            setCaseFile(SAMPLE_CASE);
          }}
          className="rounded-sm border border-border px-4 py-2 uppercase tracking-widest hover:bg-secondary"
        >
          {t("loadSample")}
        </button>
        <button
          onClick={() => {
            const next = !muted;
            setMuted(next);
            setMutedState(next);
          }}
          className="rounded-sm border border-border px-4 py-2 uppercase tracking-widest hover:bg-secondary"
        >
          {t("sound")}: {muted ? t("off") : t("on")}
        </button>
      </div>
    </main>
  );
}
