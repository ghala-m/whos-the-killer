import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  caseIssues,
  emptyCase,
  loadCase,
  SAMPLE_CASE,
  saveCase,
  uid,
  validateCase,
  type CaseFile,
  type Clue,
  type Gender,
  type Suspect,
} from "@/lib/case-model";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Case Setup — Case Closed" },
      {
        name: "description",
        content: "Build your mystery: choose the victim, add suspects from your teaching staff, write clues, and pick the culprit.",
      },
      { property: "og:title", content: "Case Setup — Case Closed" },
      { property: "og:description", content: "Configure victim, suspects, clues, culprit and countdown for your classroom mystery." },
    ],
  }),
  component: SetupPage,
});

const ROLE_PRESETS = ["Lecturer", "TA", "Student Assistant"];
const AVATAR_CHOICES = ["🕵️", "🧑‍🏫", "👩‍💻", "🧑‍🎓", "👩‍🔬", "🧑‍🔧", "👮", "🧙", "🦹", "🧑‍🚀"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-sm border border-input bg-secondary px-3 py-2 text-base text-foreground placeholder:text-muted-foreground/60";

function SetupPage() {
  const router = useRouter();
  const [c, setC] = useState<CaseFile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setC(loadCase());
  }, []);

  useEffect(() => {
    if (c) saveCase(c);
  }, [c]);

  if (!c) return <main className="min-h-screen p-10 text-muted-foreground">Opening case file…</main>;

  const update = (patch: Partial<CaseFile>) => setC({ ...c, ...patch });
  const issues = caseIssues(c);
  const blocking = issues.filter((i) => i.level === "error");

  const addSuspect = () =>
    update({
      suspects: [...c.suspects, { id: uid(), name: "", gender: "unspecified", role: "Lecturer", avatar: "🕵️" } as Suspect],
    });

  const patchSuspect = (id: string, patch: Partial<Suspect>) =>
    update({ suspects: c.suspects.map((s) => (s.id === id ? { ...s, ...patch } : s)) });

  const removeSuspect = (id: string) =>
    setC({
      ...c,
      suspects: c.suspects.filter((s) => s.id !== id),
      clues: c.clues.map((cl) => ({ ...cl, eliminates: cl.eliminates.filter((e) => e !== id) })),
      killerId: c.killerId === id ? null : c.killerId,
    });

  const addClue = () => update({ clues: [...c.clues, { id: uid(), text: "", eliminates: [] } as Clue] });
  const patchClue = (id: string, patch: Partial<Clue>) =>
    update({ clues: c.clues.map((cl) => (cl.id === id ? { ...cl, ...patch } : cl)) });

  const moveClue = (index: number, dir: -1 | 1) => {
    const next = [...c.clues];
    const target = index + dir;
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    update({ clues: next });
  };

  const uploadAvatar = (file: File, apply: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => apply(String(reader.result));
    reader.readAsDataURL(file);
  };

  const exportCase = () => {
    const blob = new Blob([JSON.stringify(c, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "case-closed.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCase = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = validateCase(JSON.parse(String(reader.result)));
        if (!parsed) {
          setMessage("That file isn't a valid case file.");
          return;
        }
        setC(parsed);
        setMessage("Case imported.");
      } catch {
        setMessage("Could not read that file — is it valid JSON?");
      }
    };
    reader.readAsText(file);
  };

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-primary">Detective's desk</p>
          <h1 className="mt-1 text-4xl">Case Setup</h1>
        </div>
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-widest">
          <button onClick={() => setC(SAMPLE_CASE)} className="rounded-sm border border-border px-3 py-2 hover:bg-secondary">
            Sample case
          </button>
          <button onClick={() => setC(emptyCase())} className="rounded-sm border border-border px-3 py-2 hover:bg-secondary">
            Reset
          </button>
          <button onClick={exportCase} className="rounded-sm border border-border px-3 py-2 hover:bg-secondary">
            Export
          </button>
          <button onClick={() => fileRef.current?.click()} className="rounded-sm border border-border px-3 py-2 hover:bg-secondary">
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importCase(f);
              e.target.value = "";
            }}
          />
        </div>
      </header>

      {message && <p className="mt-4 rounded-sm border border-primary/40 bg-primary/10 px-4 py-2 text-sm">{message}</p>}

      {/* Victim */}
      <section className="mt-8 rounded-lg border border-border bg-card p-5">
        <h2 className="text-2xl">The Victim</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Name">
            <input
              className={inputClass}
              value={c.victim.name}
              onChange={(e) => update({ victim: { ...c.victim, name: e.target.value } })}
            />
          </Field>
          <Field label="Preset">
            <select
              className={inputClass}
              value={c.victim.preset}
              onChange={(e) => {
                const preset = e.target.value as CaseFile["victim"]["preset"];
                const presets = { duck: { name: "Rubber Duck", avatar: "🦆" }, tux: { name: "Tux the Penguin", avatar: "🐧" } };
                update({
                  victim:
                    preset === "custom"
                      ? { ...c.victim, preset }
                      : { preset, name: presets[preset].name, avatar: presets[preset].avatar },
                });
              }}
            >
              <option value="duck">Rubber Duck</option>
              <option value="tux">Tux the Penguin</option>
              <option value="custom">Custom</option>
            </select>
          </Field>
          <Field label="Avatar (emoji or image)">
            <div className="flex items-center gap-2">
              <input
                className={inputClass}
                value={c.victim.avatar.startsWith("data:") ? "(uploaded image)" : c.victim.avatar}
                onChange={(e) => update({ victim: { ...c.victim, avatar: e.target.value, preset: "custom" } })}
              />
              <label className="cursor-pointer rounded-sm border border-border px-3 py-2 text-xs uppercase hover:bg-secondary">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadAvatar(f, (d) => update({ victim: { ...c.victim, avatar: d, preset: "custom" } }));
                  }}
                />
              </label>
            </div>
          </Field>
        </div>
      </section>

      {/* Suspects */}
      <section className="mt-6 rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl">Suspects ({c.suspects.length})</h2>
          <button onClick={addSuspect} className="rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            + Add suspect
          </button>
        </div>
        <ul className="mt-4 space-y-3">
          {c.suspects.map((s) => (
            <li key={s.id} className="rounded-sm border border-border bg-secondary/40 p-4">
              <div className="grid gap-3 sm:grid-cols-[auto_1fr_1fr_1fr_auto] sm:items-end">
                <Field label="Avatar">
                  <select
                    className={inputClass}
                    value={s.avatar.startsWith("data:") ? "" : s.avatar}
                    onChange={(e) => patchSuspect(s.id, { avatar: e.target.value })}
                  >
                    {s.avatar.startsWith("data:") && <option value="">(image)</option>}
                    {AVATAR_CHOICES.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Name">
                  <input className={inputClass} value={s.name} onChange={(e) => patchSuspect(s.id, { name: e.target.value })} />
                </Field>
                <Field label="Role">
                  <input
                    className={inputClass}
                    list="role-presets"
                    value={s.role}
                    onChange={(e) => patchSuspect(s.id, { role: e.target.value })}
                  />
                </Field>
                <Field label="Gender">
                  <select
                    className={inputClass}
                    value={s.gender}
                    onChange={(e) => patchSuspect(s.id, { gender: e.target.value as Gender })}
                  >
                    <option value="unspecified">Unspecified</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </Field>
                <div className="flex gap-2">
                  <label className="cursor-pointer rounded-sm border border-border px-3 py-2 text-xs uppercase hover:bg-secondary">
                    Img
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadAvatar(f, (d) => patchSuspect(s.id, { avatar: d }));
                      }}
                    />
                  </label>
                  <button
                    onClick={() => removeSuspect(s.id)}
                    className="rounded-sm border border-destructive/60 px-3 py-2 text-xs uppercase text-destructive hover:bg-destructive/15"
                  >
                    Del
                  </button>
                </div>
              </div>
              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="killer"
                  checked={c.killerId === s.id}
                  onChange={() => update({ killerId: s.id })}
                  className="size-4 accent-[oklch(0.72_0.15_68)]"
                />
                <span className="uppercase tracking-widest">Culprit</span>
              </label>
            </li>
          ))}
        </ul>
        <datalist id="role-presets">
          {ROLE_PRESETS.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
      </section>

      {/* Clues */}
      <section className="mt-6 rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl">Clues ({c.clues.length})</h2>
          <button onClick={addClue} className="rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            + Add clue
          </button>
        </div>
        <ol className="mt-4 space-y-3">
          {c.clues.map((cl, i) => (
            <li key={cl.id} className="rounded-sm border border-border bg-secondary/40 p-4">
              <div className="flex items-start gap-3">
                <span className="font-display text-lg text-brass">{i + 1}</span>
                <textarea
                  className={`${inputClass} min-h-20`}
                  placeholder="The culprit was seen…"
                  value={cl.text}
                  onChange={(e) => patchClue(cl.id, { text: e.target.value })}
                />
                <div className="flex flex-col gap-1 text-xs">
                  <button onClick={() => moveClue(i, -1)} className="rounded-sm border border-border px-2 py-1 hover:bg-secondary">
                    ↑
                  </button>
                  <button onClick={() => moveClue(i, 1)} className="rounded-sm border border-border px-2 py-1 hover:bg-secondary">
                    ↓
                  </button>
                  <button
                    onClick={() => update({ clues: c.clues.filter((x) => x.id !== cl.id) })}
                    className="rounded-sm border border-destructive/60 px-2 py-1 text-destructive hover:bg-destructive/15"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <fieldset className="mt-3">
                <legend className="text-xs uppercase tracking-widest text-muted-foreground">Eliminates</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.suspects.map((s) => {
                    const on = cl.eliminates.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${
                          on ? "border-destructive bg-destructive/20 text-destructive-foreground" : "border-border"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={on}
                          onChange={() =>
                            patchClue(cl.id, {
                              eliminates: on ? cl.eliminates.filter((e) => e !== s.id) : [...cl.eliminates, s.id],
                            })
                          }
                        />
                        {s.avatar.startsWith("data:") ? "🖼" : s.avatar} {s.name || "Unnamed"}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </li>
          ))}
        </ol>
      </section>

      {/* Settings + start */}
      <section className="mt-6 rounded-lg border border-border bg-card p-5">
        <h2 className="text-2xl">Final Countdown</h2>
        <div className="mt-4 max-w-xs">
          <Field label="Duration (seconds)">
            <input
              type="number"
              min={5}
              max={600}
              className={inputClass}
              value={c.settings.countdownSeconds}
              onChange={(e) => update({ settings: { countdownSeconds: Math.max(5, Number(e.target.value) || 60) } })}
            />
          </Field>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <button
          disabled={blocking.length > 0}
          onClick={() => {
            saveCase(c);
            router.navigate({ to: "/play" });
          }}
          className="rounded-sm bg-primary px-6 py-3 font-display text-lg text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save &amp; Start
        </button>
        <Link to="/" className="rounded-sm border border-border px-6 py-3 font-display text-lg hover:bg-secondary">
          Main menu
        </Link>
        <ul className="text-sm">
          {issues.map((i) => (
            <li key={i.message} className={i.level === "error" ? "text-destructive" : "text-brass"}>
              {i.level === "error" ? "✕" : "!"} {i.message}
            </li>
          ))}
          {issues.length === 0 && <li className="text-primary">Case is airtight. Ready to play.</li>}
        </ul>
      </div>
    </main>
  );
}
