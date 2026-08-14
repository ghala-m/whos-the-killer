export type Gender = "female" | "male" | "unspecified";

export interface Suspect {
  id: string;
  name: string;
  gender: Gender;
  role: string;
  avatar: string; // emoji or data URL
}

export interface Clue {
  id: string;
  text: string;
  eliminates: string[]; // suspect ids
}

export interface Victim {
  name: string;
  preset: "duck" | "tux" | "custom";
  avatar: string;
}

export interface CaseFile {
  victim: Victim;
  suspects: Suspect[];
  clues: Clue[];
  killerId: string | null;
  settings: { countdownSeconds: number; teams: string[] };
}

export const STORAGE_KEY = "case-closed:case";

export const uid = () => Math.random().toString(36).slice(2, 10);

export const SAMPLE_CASE: CaseFile = {
  victim: { name: "Rubber Duck", preset: "duck", avatar: "🦆" },
  suspects: [
    { id: "s1", name: "Prof. Halvorsen", gender: "male", role: "Lecturer", avatar: "🧑‍🏫" },
    { id: "s2", name: "Dana Reyes", gender: "female", role: "TA", avatar: "👩‍💻" },
    { id: "s3", name: "Miko Tan", gender: "unspecified", role: "Student Assistant", avatar: "🧑‍🎓" },
    { id: "s4", name: "Dr. Okonkwo", gender: "female", role: "Lecturer", avatar: "👩‍🔬" },
    { id: "s5", name: "Sam Vance", gender: "male", role: "TA", avatar: "🕵️" },
  ],
  clues: [
    { id: "c1", text: "The culprit was seen leaving the lab after midnight — anyone with a 9am lecture had an alibi.", eliminates: ["s1"] },
    { id: "c2", text: "A trail of coffee led to the crime scene. The culprit does not drink coffee... wait, they do. Tea drinkers are cleared.", eliminates: ["s4"] },
    { id: "c3", text: "The keycard log shows the culprit has full lab access — students assistants do not.", eliminates: ["s3"] },
    { id: "c4", text: "The rubber duck's final squeak was recorded. The voice on the tape was unmistakably not Sam's.", eliminates: ["s5"] },
  ],
  killerId: "s2",
  settings: { countdownSeconds: 60, teams: ["Team 1", "Team 2", "Team 3"] },
};

export function emptyCase(): CaseFile {
  return {
    victim: { name: "Rubber Duck", preset: "duck", avatar: "🦆" },
    suspects: [],
    clues: [],
    killerId: null,
    settings: { countdownSeconds: 60, teams: ["Team 1", "Team 2"] },
  };
}

export function validateCase(c: unknown): CaseFile | null {
  try {
    const k = c as CaseFile;
    if (!k || typeof k !== "object") return null;
    if (!k.victim || typeof k.victim.name !== "string") return null;
    if (!Array.isArray(k.suspects) || !Array.isArray(k.clues)) return null;
    for (const s of k.suspects) if (!s.id || typeof s.name !== "string") return null;
    for (const cl of k.clues) if (!cl.id || typeof cl.text !== "string" || !Array.isArray(cl.eliminates)) return null;
    return {
      victim: { name: k.victim.name, preset: k.victim.preset ?? "custom", avatar: k.victim.avatar || "🦆" },
      suspects: k.suspects,
      clues: k.clues,
      killerId: k.killerId ?? null,
      settings: {
        countdownSeconds: Number(k.settings?.countdownSeconds) || 60,
        teams:
          Array.isArray(k.settings?.teams) && k.settings.teams.length > 0
            ? k.settings.teams.map((t) => String(t))
            : ["Team 1", "Team 2"],
      },
    };
  } catch {
    return null;
  }
}

export function loadCase(): CaseFile {
  if (typeof window === "undefined") return SAMPLE_CASE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SAMPLE_CASE;
    return validateCase(JSON.parse(raw)) ?? SAMPLE_CASE;
  } catch {
    return SAMPLE_CASE;
  }
}

export function saveCase(c: CaseFile) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {
    /* storage unavailable */
  }
}

export interface CaseIssue {
  level: "error" | "warning";
  message: string;
}

export function caseIssues(c: CaseFile): CaseIssue[] {
  const issues: CaseIssue[] = [];
  if (c.suspects.length < 3) issues.push({ level: "error", message: "Add at least 3 suspects." });
  if (c.clues.length < 1) issues.push({ level: "error", message: "Add at least 1 clue." });
  if (!c.killerId) issues.push({ level: "error", message: "Designate one suspect as the culprit." });
  if (c.killerId && !c.suspects.some((s) => s.id === c.killerId))
    issues.push({ level: "error", message: "The designated culprit is no longer in the suspect list." });
  if (c.killerId && c.clues.some((cl) => cl.eliminates.includes(c.killerId!)))
    issues.push({ level: "error", message: "A clue eliminates your designated culprit — contradictory case." });
  const survivors = c.suspects.filter((s) => !c.clues.some((cl) => cl.eliminates.includes(s.id)));
  if (survivors.length > 1)
    issues.push({
      level: "warning",
      message: `${survivors.length} suspects survive every clue — the room will have to guess between them.`,
    });
  if (c.suspects.some((s) => !s.name.trim())) issues.push({ level: "warning", message: "Some suspects have no name." });
  if (!c.settings.teams || c.settings.teams.length < 1)
    issues.push({ level: "error", message: "Add at least one competing team." });
  return issues;
}
