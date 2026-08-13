import type { Suspect } from "@/lib/case-model";

interface Props {
  suspects: Suspect[];
  eliminated: Set<string>;
  revealedCount?: number; // how many suspects have entered (phase 1 stagger)
  highlightId?: string | null;
}

export function SuspectCard({
  suspect,
  eliminated,
  index,
  highlighted,
}: {
  suspect: Suspect;
  eliminated: boolean;
  index: number;
  highlighted?: boolean;
}) {
  const isImage = suspect.avatar.startsWith("data:");
  const tilt = ((index % 5) - 2) * 1.4;
  return (
    <figure
      className={`anim-drop paper relative w-40 rounded-sm p-3 text-center transition-all duration-500 sm:w-44 ${
        eliminated ? "grayscale opacity-45" : ""
      } ${highlighted ? "ring-4 ring-brass scale-105" : ""}`}
      style={{ ["--tilt" as string]: `${tilt}deg`, transform: `rotate(${tilt}deg)`, animationDelay: `${index * 0.12}s` }}
    >
      <span
        aria-hidden="true"
        className="absolute -top-2 left-1/2 size-4 -translate-x-1/2 rounded-full bg-evidence shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
      />
      <div className="mx-auto flex h-24 w-full items-center justify-center overflow-hidden rounded-sm bg-cork/25 text-5xl">
        {isImage ? (
          <img src={suspect.avatar} alt={suspect.name} className="h-24 w-full object-cover" />
        ) : (
          <span role="img" aria-label={suspect.name}>
            {suspect.avatar || "🕵️"}
          </span>
        )}
      </div>
      <figcaption className="mt-2">
        <p className="font-display text-base leading-tight">{suspect.name || "Unnamed"}</p>
        <p className="text-xs uppercase tracking-widest opacity-70">{suspect.role || "Suspect"}</p>
      </figcaption>
      {eliminated && (
        <span
          aria-label="Eliminated"
          className="pointer-events-none absolute inset-0 grid place-items-center text-7xl font-black text-evidence/85"
        >
          ✕
        </span>
      )}
    </figure>
  );
}

export function CaseBoard({ suspects, eliminated, revealedCount, highlightId }: Props) {
  const shown = revealedCount === undefined ? suspects : suspects.slice(0, revealedCount);
  return (
    <div className="corkboard rounded-lg border-8 border-[oklch(0.32_0.04_60)] p-5 shadow-noir">
      <ul className="flex flex-wrap items-start justify-center gap-5">
        {shown.map((s, i) => (
          <li key={s.id}>
            <SuspectCard
              suspect={s}
              index={i}
              eliminated={eliminated.has(s.id)}
              highlighted={highlightId === s.id}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
