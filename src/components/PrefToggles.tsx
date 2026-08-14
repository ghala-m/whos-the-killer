import { useUi } from "@/lib/ui-prefs";

export function PrefToggles({ className = "" }: { className?: string }) {
  const { t, theme, toggleLang, toggleTheme } = useUi();
  const btn = "rounded-sm border border-border px-3 py-2 text-xs uppercase tracking-widest hover:bg-secondary";
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button type="button" onClick={toggleLang} className={btn}>
        {t("language")}
      </button>
      <button type="button" onClick={toggleTheme} className={btn}>
        {theme === "dark" ? `☀ ${t("light")}` : `☾ ${t("dark")}`}
      </button>
    </div>
  );
}
