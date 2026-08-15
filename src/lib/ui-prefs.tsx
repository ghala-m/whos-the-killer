import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";
export type Theme = "dark" | "light";

const LANG_KEY = "case-closed:lang";
const THEME_KEY = "case-closed:theme";

const en = {
  brand: "Who's the Killer?",
  caseNo: "Case File No. 07 — Open",

  tagline: "A projector-ready classroom mystery. One screen, one culprit, and a room full of detectives.",
  currentCase: "Current case",
  suspects: "suspects",
  clues: "clues",
  teams: "teams",
  start: "Start Investigation",
  setup: "Case Setup",
  loadSample: "Load sample case",
  sound: "Sound",
  on: "on",
  off: "off",
  language: "العربية",
  theme: "Theme",
  light: "Light",
  dark: "Dark",
  mainMenu: "Main menu",
  // setup
  desk: "Detective's desk",
  setupTitle: "Case Setup",
  sampleCase: "Sample case",
  reset: "Reset",
  export: "Export",
  import: "Import",
  victim: "The Victim",
  name: "Name",
  preset: "Preset",
  avatar: "Avatar (emoji or image)",
  upload: "Upload",
  rubberDuck: "Rubber Duck",
  tux: "Tux the Penguin",
  custom: "Custom",
  suspectsTitle: "Suspects",
  addSuspect: "+ Add suspect",
  role: "Role",
  gender: "Gender",
  unspecified: "Unspecified",
  female: "Female",
  male: "Male",
  img: "Img",
  del: "Del",
  culprit: "Culprit",
  cluesTitle: "Clues",
  addClue: "+ Add clue",
  cluePlaceholder: "The culprit was seen…",
  eliminates: "Clears",
  countdownTitle: "Final Countdown",
  duration: "Duration (seconds)",
  teamsTitle: "Competing Teams",
  teamsHint: "Teams race to catch the killer. Their answering order is drawn on the roulette wheel.",
  teamCount: "Number of teams",
  teamName: "Team name",
  saveStart: "Save & Start",
  airtight: "Case is airtight. Ready to play.",
  invalidFile: "That file isn't a valid case file.",
  badJson: "Could not read that file — is it valid JSON?",
  imported: "Case imported.",
  // play
  phase1: "Phase 1 — The Scene",
  phase2: "Phase 2 — Clue",
  of: "of",
  phase3: "Phase 3 — Final Countdown",
  phase4: "Phase 4 — Draw the Order",
  phase5: "Phase 5 — The Accusation",
  phase6: "The Reveal",
  exit: "Exit",
  notReady: "This case isn't ready",
  notReadyHint: "Finish setup before running the game.",
  goSetup: "Go to Case Setup",
  victimLabel: "Victim",
  foundAtScene: "Found at the scene. No witnesses.",
  theSuspects: "The Suspects",
  showAll: "Show all",
  begin: "Begin Investigation",
  noCluesYet: "No clues yet. Reveal the first one.",
  clue: "Clue",
  previous: "Previous",
  revealNext: "Reveal Next Clue",
  toCountdown: "Proceed to Final Countdown",
  makeAccusation: "Discuss your accusation",
  pause: "Pause",
  resume: "Resume",
  skipToDraw: "Skip to the Draw",
  spinTitle: "Who answers first?",
  spin: "Spin the wheel",
  spinning: "Spinning…",
  order: "Answering order",
  startAccusations: "Start accusations",
  turnOf: "It's the turn of",
  pickSuspect: "Tap the suspect you accuse",
  correct: "CORRECT!",
  wrong: "WRONG!",
  caught: "caught the killer",
  passing: "Turn passes to the next team…",
  noWinner: "Nobody caught the killer",
  culpritIs: "The culprit is…",
  drumroll: "Drumroll…",
  guiltyOf: "Guilty of the murder of",
  playAgain: "Play again",
  cleared: "CLEARED",
  accused: "ACCUSED",
  eliminatedSuspects: "Cleared by the clues",
} as const;

type Dict = Record<keyof typeof en, string>;

const ar: Dict = {
  brand: "مَن القاتل؟",
  caseNo: "ملف القضية رقم ٠٧ — قضية مفتوحة",

  tagline: "لغز جريمة صفّي جاهز للعرض على الشاشة. شاشة واحدة، قاتل واحد، وغرفة مليئة بالمحققين.",
  currentCase: "القضية الحالية",
  suspects: "مشتبهين",
  clues: "أدلة",
  teams: "فرق",
  start: "ابدأ التحقيق",
  setup: "إعداد القضية",
  loadSample: "تحميل قضية جاهزة",
  sound: "الصوت",
  on: "مفعّل",
  off: "مغلق",
  language: "English",
  theme: "المظهر",
  light: "نهاري",
  dark: "ليلي",
  mainMenu: "القائمة الرئيسية",
  desk: "مكتب المحقق",
  setupTitle: "إعداد القضية",
  sampleCase: "قضية جاهزة",
  reset: "تصفير",
  export: "تصدير",
  import: "استيراد",
  victim: "الضحية",
  name: "الاسم",
  preset: "قالب",
  avatar: "الصورة (إيموجي أو صورة)",
  upload: "رفع",
  rubberDuck: "البطة المطاطية",
  tux: "البطريق تُكس",
  custom: "مخصص",
  suspectsTitle: "المشتبه بهم",
  addSuspect: "+ إضافة مشتبه",
  role: "الوظيفة",
  gender: "الجنس",
  unspecified: "غير محدد",
  female: "أنثى",
  male: "ذكر",
  img: "صورة",
  del: "حذف",
  culprit: "القاتل",
  cluesTitle: "الأدلة",
  addClue: "+ إضافة دليل",
  cluePlaceholder: "شوهد القاتل…",
  eliminates: "يبرّئ",
  countdownTitle: "العد التنازلي الأخير",
  duration: "المدة (ثانية)",
  teamsTitle: "الفرق المتنافسة",
  teamsHint: "تتنافس الفرق على القبض على القاتل، ويُحدد ترتيب إجاباتها بعجلة الروليت.",
  teamCount: "عدد الفرق",
  teamName: "اسم الفريق",
  saveStart: "حفظ وبدء اللعب",
  airtight: "القضية محكمة. جاهزة للعب.",
  invalidFile: "هذا الملف ليس ملف قضية صالحاً.",
  badJson: "لم نستطع قراءة الملف — هل هو JSON صالح؟",
  imported: "تم استيراد القضية.",
  phase1: "المرحلة ١ — مسرح الجريمة",
  phase2: "المرحلة ٢ — الدليل",
  of: "من",
  phase3: "المرحلة ٣ — العد التنازلي",
  phase4: "المرحلة ٤ — سحب الترتيب",
  phase5: "المرحلة ٥ — الاتهام",
  phase6: "الكشف",
  exit: "خروج",
  notReady: "هذه القضية غير مكتملة",
  notReadyHint: "أكمل الإعداد قبل بدء اللعبة.",
  goSetup: "اذهب إلى إعداد القضية",
  victimLabel: "الضحية",
  foundAtScene: "وُجدت في مسرح الجريمة. لا شهود.",
  theSuspects: "المشتبه بهم",
  showAll: "إظهار الجميع",
  begin: "ابدأ التحقيق",
  noCluesYet: "لا أدلة بعد. اكشف الدليل الأول.",
  clue: "دليل",
  previous: "السابق",
  revealNext: "اكشف الدليل التالي",
  toCountdown: "إلى العد التنازلي",
  makeAccusation: "ناقشوا اتهامكم",
  pause: "إيقاف مؤقت",
  resume: "متابعة",
  skipToDraw: "تخطَّ إلى السحب",
  spinTitle: "من يجيب أولاً؟",
  spin: "أدر العجلة",
  spinning: "تدور…",
  order: "ترتيب الإجابة",
  startAccusations: "ابدأ الاتهامات",
  turnOf: "الدور على",
  pickSuspect: "اضغط على المشتبه الذي تتهمه",
  correct: "إجابة صحيحة!",
  wrong: "إجابة خاطئة!",
  caught: "قبض على القاتل",
  passing: "ينتقل الدور إلى الفريق التالي…",
  noWinner: "لم يقبض أحد على القاتل",
  culpritIs: "القاتل هو…",
  drumroll: "دقّات الطبول…",
  guiltyOf: "مُدان بقتل",
  playAgain: "العب مرة أخرى",
  cleared: "بريء",
  accused: "مُتهم",
  eliminatedSuspects: "برّأتهم الأدلة",
};

const DICTS: Record<Lang, Dict> = { en: en as unknown as Dict, ar };

interface Ctx {
  lang: Lang;
  dir: "ltr" | "rtl";
  theme: Theme;
  t: (key: keyof typeof en) => string;
  toggleLang: () => void;
  toggleTheme: () => void;
}

const UiCtx = createContext<Ctx | null>(null);

export function UiPrefsProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    try {
      const l = window.localStorage.getItem(LANG_KEY) as Lang | null;
      const th = window.localStorage.getItem(THEME_KEY) as Theme | null;
      if (l === "ar" || l === "en") setLang(l);
      if (th === "light" || th === "dark") setTheme(th);
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
    root.classList.toggle("light", theme === "light");
    root.classList.toggle("dark", theme === "dark");
    try {
      window.localStorage.setItem(LANG_KEY, lang);
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* storage unavailable */
    }
  }, [lang, theme]);

  const t = useCallback((key: keyof typeof en) => DICTS[lang][key] ?? (en as unknown as Dict)[key], [lang]);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      theme,
      t,
      toggleLang: () => setLang((l) => (l === "en" ? "ar" : "en")),
      toggleTheme: () => setTheme((th) => (th === "dark" ? "light" : "dark")),
    }),
    [lang, theme, t],
  );

  return <UiCtx.Provider value={value}>{children}</UiCtx.Provider>;
}

export function useUi() {
  const ctx = useContext(UiCtx);
  if (!ctx) throw new Error("useUi must be used inside UiPrefsProvider");
  return ctx;
}
