import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase Client ───────────────────────────────────────────────────────────
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { flowType: "pkce" },
});

// ─── Constants ─────────────────────────────────────────────────────────────────
const FREE_PREVIEW_DAYS = 2;
const FREE_FULL_PLAN_LIMIT = 3;
const PLAN_USAGE_STORAGE_KEY = "exampilot-full-plan-usage-count";
const PLAN_SESSION_STORAGE_KEY = "exampilot-current-plan-session";
const PLAN_PROGRESS_STORAGE_PREFIX = "exampilot-plan-progress";
const DAILY_CHECKIN_STORAGE_KEY = "exampilot-daily-checkin";
const PLAN_CONFIDENCE_STORAGE_PREFIX = "exampilot-plan-confidence";
const PLAN_REFLECTION_STORAGE_PREFIX = "exampilot-plan-reflection";
const FOUNDER_MODE_STORAGE_KEY = "exampilot-founder-mode";
const FOUNDER_MODE_QUERY_KEY = "pilot";
const FOUNDER_MODE_QUERY_VALUE = "founder";
const UPI_ID = "agrawalakshit0809-1@okaxis";
const WHATSAPP_NUMBER = "918160971738";
const PAYMENT_AMOUNT = "49";
const UPI_PAYEE_NAME = "ExamPilot";
const DEFAULT_BACKEND_BASE = "https://lectai-backend.onrender.com";
const DEFAULT_FORM_DATA = {
  examType: "JEE",
  syllabus: "",
  examDate: "",
  studyHours: "5",
};
const STREAK_REWARD_MILESTONES = [
  {
    days: 7,
    title: "Consistency Reward",
    description: "Reach a 7-day streak and prove you can study every day for one full week.",
  },
  {
    days: 30,
    title: "Discipline Reward",
    description: "Reach a 30-day streak and build a true long-term study habit.",
  },
];
const EMPTY_RESULT = {
  fullPlan: [],
  todayPlan: null,
  daysLeft: null,
  planKey: "",
  meta: null,
};
const EMPTY_REFLECTION = {
  hardestPart: "",
  practiceCount: "",
  supportNeed: "",
  otherIssue: "",
  weakTask: "",       
};
const HARDEST_PART_OPTIONS = [
  { value: "concepts", label: "Concepts were unclear" },
  { value: "application", label: "Could not solve application questions" },
  { value: "speed", label: "Time/speed was the problem" },
  { value: "memory", label: "I forgot steps, formulas, or facts" },
];
const PRACTICE_COUNT_OPTIONS = [
  { value: "0", label: "No practice questions" },
  { value: "1-3", label: "Only 1 to 3 questions" },
  { value: "4-10", label: "Around 4 to 10 questions" },
  { value: "10+", label: "More than 10 questions" },
];
const SUPPORT_NEED_OPTIONS = [
  { value: "simpler", label: "Need simpler explanation" },
  { value: "examples", label: "Need more examples" },
  { value: "carryforward", label: "Need this carried forward tomorrow" },
  { value: "revision", label: "Need one more revision round" },
];

const SECTION_HEADING_PATTERN =
  /^(Morning(?:\s*\([^)]*\))?|Evening(?:\s*\([^)]*\))?|Must Finish Today|Practice|Revision Check|Key Points|Practice Questions|Memory Tricks|Focus|Why This Day Matters)\s*:?\s*(.*)$/i;

// ─── Auth Component ─────────────────────────────────────────────────────────────
function Auth() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const sendMagicLink = async () => {
    if (!email || !name) {
      setMessage("Please enter your name and email.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: "https://exampilot-frontend-delta.vercel.app",
        data: { name, phone },
      },
    });
    if (error) {
      setMessage(error.message);
    } else {
      setSent(true);
      setMessage("");
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div style={authStyles.container}>
        <div style={authStyles.card}>
          <div style={authStyles.brandPill}>ExamPilot</div>
          <h1 style={authStyles.title}>Check your email</h1>
          <p style={authStyles.subtitle}>
            We sent a sign-in link to <strong>{email}</strong>
          </p>
          <p style={authStyles.subtitle}>
            Click the link in your email to log in. You can close this tab.
          </p>
          <p style={authStyles.betaNote}>
            🎉 Free during beta — full plan unlocked for all early users.
          </p>
          <button
            style={{ ...authStyles.button, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", marginTop: "8px" }}
            onClick={() => { setSent(false); setMessage(""); }}
          >
            ← Use different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={authStyles.container}>
      <div style={authStyles.card}>
        <div style={authStyles.brandPill}>ExamPilot</div>
        <h1 style={authStyles.title}>Know exactly what to study today.</h1>
        <p style={authStyles.subtitle}>
          Your AI Study OS for JEE, NEET &amp; UPSC — free during beta.
        </p>
        <div style={authStyles.form}>
          <input
            style={authStyles.input}
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            style={authStyles.input}
            placeholder="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            style={authStyles.input}
            placeholder="Phone number (for reminders)"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button
            style={authStyles.button}
            onClick={sendMagicLink}
            disabled={loading}
          >
            {loading ? "Sending link..." : "Get Started Free →"}
          </button>
          <p style={authStyles.betaNote}>
            🎉 Free during beta — full plan unlocked for all early users.
          </p>
        </div>
        {message && <p style={authStyles.message}>{message}</p>}
      </div>
    </div>
  );
}

const authStyles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "radial-gradient(circle at top, rgba(45, 212, 191, 0.18), transparent 28%), linear-gradient(180deg, #070b14 0%, #0b1220 55%, #070b14 100%)",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "36px 28px",
    borderRadius: "24px",
    background: "rgba(10, 15, 28, 0.92)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  brandPill: {
    display: "inline-flex",
    alignSelf: "flex-start",
    padding: "6px 14px",
    borderRadius: "999px",
    background: "rgba(45, 212, 191, 0.14)",
    color: "#99f6e4",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    color: "#f8fafc",
    fontSize: "clamp(1.5rem, 5vw, 2rem)",
    lineHeight: 1.15,
    letterSpacing: "-0.03em",
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
  },
  subtitle: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "0.95rem",
    lineHeight: 1.6,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  input: {
    background: "rgba(15, 23, 42, 0.92)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "14px",
    padding: "13px 16px",
    color: "#f8fafc",
    fontSize: "15px",
    outline: "none",
    fontFamily: "'Inter', sans-serif",
  },
  button: {
    background: "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)",
    color: "#f8fafc",
    border: "none",
    borderRadius: "14px",
    padding: "14px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "4px",
    fontFamily: "'Inter', sans-serif",
  },
  backBtn: {
    background: "transparent",
    color: "#94a3b8",
    border: "none",
    fontSize: "13px",
    cursor: "pointer",
    textAlign: "center",
  },
  hint: { color: "#94a3b8", fontSize: "13px", textAlign: "center", margin: 0 },
  message: {
    color: "#5eead4",
    fontSize: "13px",
    textAlign: "center",
    margin: 0,
    lineHeight: 1.5,
  },
  betaNote: {
    color: "#5eead4",
    fontSize: "13px",
    textAlign: "center",
    margin: 0,
    lineHeight: 1.5,
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────────
function buildWhatsAppLink() {
  const message = encodeURIComponent(
    `Hi ExamPilot, I paid Rs ${PAYMENT_AMOUNT} to unlock my full study plan. Sharing my payment screenshot here.`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
}

function ReflectionOptionGroup({ label, value, options, onSelect }) {
  return (
    <div style={styles.followUpField}>
      <p style={styles.followUpQuestion}>{label}</p>
      <div style={styles.followUpChoices}>
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              style={{
                ...styles.followUpChoiceButton,
                ...(active ? styles.followUpChoiceButtonActive : {}),
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function buildUpiPaymentLink() {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: UPI_PAYEE_NAME,
    am: PAYMENT_AMOUNT,
    cu: "INR",
    tn: "ExamPilot full plan unlock",
  });
  return `upi://pay?${params.toString()}`;
}

function buildQrImageUrl() {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    buildUpiPaymentLink()
  )}`;
}

function buildAdaptiveGuidance(confidence, reflection) {
  if (confidence === 5) {
    return {
      title: "Go forward",
      body: "You rated yourself very strong today. Move to the next day, but still keep the revision check in your routine.",
      action: "Continue with tomorrow's plan and keep one short revision pass later.",
    };
  }
  if (
    reflection.supportNeed === "examples" &&
    (reflection.hardestPart === "application" ||
      reflection.practiceCount === "0" ||
      reflection.practiceCount === "1-3")
  ) {
    return {
      title: "Use worked examples before fresh questions",
      body: "You likely need guided examples, not just more reading. Build pattern recognition first, then retry similar questions on your own.",
      action: "Tomorrow: 2 solved examples + 3 similar practice questions before moving ahead.",
    };
  }
  if (reflection.supportNeed === "carryforward") {
    return {
      title: "Carry this forward before new topics",
      body: "Do not move to fresh syllabus immediately. This topic needs one more focused block first so the backlog does not get deeper.",
      action: "Tomorrow: finish this weak topic first, then continue the main plan.",
    };
  }
  if (reflection.hardestPart === "speed") {
    return {
      title: "Reduce load and use timed recovery",
      body: "The understanding may be okay, but speed and time management are hurting completion and confidence.",
      action: "Tomorrow: carry one high-priority task first, then do one 20-minute timed round.",
    };
  }
  if (
    reflection.hardestPart === "application" ||
    reflection.practiceCount === "0" ||
    reflection.practiceCount === "1-3"
  ) {
    return {
      title: "Add guided practice next",
      body: "The problem looks more like applying the topic than just reading it. You need practice repetition before moving ahead.",
      action: "Tomorrow: 3 solved examples + 5 focused practice questions on this topic first.",
    };
  }
  if (reflection.hardestPart === "memory" || reflection.supportNeed === "revision") {
    return {
      title: "Do one more revision loop",
      body: "You do not need a full reset, but recall is still weak. A tighter revision pass should help you retain the steps and facts.",
      action: "Tomorrow: quick revision first, then 3 to 5 recall-based practice questions.",
    };
  }
  if (reflection.hardestPart === "concepts" || reflection.supportNeed === "simpler") {
    return {
      title: "Rebuild the concepts first",
      body: "Your signal shows the core understanding is still weak. Spend tomorrow's first study block revising concepts before new topics.",
      action: "Tomorrow: 30-45 mins concept revision + 2 worked examples before moving ahead.",
    };
  }
  return {
    title: "Do one more recovery round",
    body: "You are not fully confident yet, so ExamPilot should treat this as a weak zone and guide one more structured pass before new topics.",
    action: "Tomorrow: revision first, then a short practice round, then continue the plan only if you feel stronger.",
  };
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function getStoredPlanUsageCount() {
  if (typeof window === "undefined") return 0;
  const rawValue = window.localStorage.getItem(PLAN_USAGE_STORAGE_KEY);
  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
}

function storePlanUsageCount(count) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLAN_USAGE_STORAGE_KEY, String(count));
}

function getProgressStorageKey(planKey) {
  return `${PLAN_PROGRESS_STORAGE_PREFIX}:${planKey}`;
}

function loadStoredPlanSession() {
  if (typeof window === "undefined") return null;
  try {
    const rawValue = window.localStorage.getItem(PLAN_SESSION_STORAGE_KEY);
    if (!rawValue) return null;
    const parsedValue = JSON.parse(rawValue);
    if (!parsedValue || typeof parsedValue !== "object") return null;
    return parsedValue;
  } catch (error) {
    return null;
  }
}

function storePlanSession(session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLAN_SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearStoredPlanSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PLAN_SESSION_STORAGE_KEY);
}

function loadStoredProgress(planKey) {
  if (typeof window === "undefined" || !planKey) return {};
  try {
    const rawValue = window.localStorage.getItem(getProgressStorageKey(planKey));
    if (!rawValue) return {};
    const parsedValue = JSON.parse(rawValue);
    return parsedValue && typeof parsedValue === "object" ? parsedValue : {};
  } catch (error) {
    return {};
  }
}

function storeProgress(planKey, progressMap) {
  if (typeof window === "undefined" || !planKey) return;
  window.localStorage.setItem(getProgressStorageKey(planKey), JSON.stringify(progressMap));
}

function getConfidenceStorageKey(planKey) {
  return `${PLAN_CONFIDENCE_STORAGE_PREFIX}:${planKey}`;
}

function loadStoredConfidence(planKey) {
  if (typeof window === "undefined" || !planKey) return 0;
  const rawValue = window.localStorage.getItem(getConfidenceStorageKey(planKey));
  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) && parsedValue >= 1 && parsedValue <= 5
    ? parsedValue
    : 0;
}

function storeConfidence(planKey, confidence) {
  if (typeof window === "undefined" || !planKey) return;
  if (!confidence) {
    window.localStorage.removeItem(getConfidenceStorageKey(planKey));
    return;
  }
  window.localStorage.setItem(getConfidenceStorageKey(planKey), String(confidence));
}

function getReflectionStorageKey(planKey) {
  return `${PLAN_REFLECTION_STORAGE_PREFIX}:${planKey}`;
}

function loadStoredReflection(planKey) {
  if (typeof window === "undefined" || !planKey) return EMPTY_REFLECTION;
  try {
    const rawValue = window.localStorage.getItem(getReflectionStorageKey(planKey));
    if (!rawValue) return EMPTY_REFLECTION;
    const parsedValue = JSON.parse(rawValue);
    return {
  hardestPart: String(parsedValue?.hardestPart || ""),
  practiceCount: String(parsedValue?.practiceCount || ""),
  supportNeed: String(parsedValue?.supportNeed || ""),
  otherIssue: String(parsedValue?.otherIssue || ""),
  weakTask: String(parsedValue?.weakTask || ""),   // ← add this line
  };
  } catch (error) {
    return EMPTY_REFLECTION;
  }
}

function storeReflection(planKey, reflection) {
  if (typeof window === "undefined" || !planKey) return;
  window.localStorage.setItem(getReflectionStorageKey(planKey), JSON.stringify(reflection));
}

function getISTDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function getYesterdayISTDateKey() {
  return getISTDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
}

function loadDailyCheckIn() {
  if (typeof window === "undefined") {
    return { streakCount: 0, lastCheckInDate: "", completionPercent: 0, checkInQuality: "", completedTodayTasks: 0, totalTodayTasks: 0 };
  }
  try {
    const rawValue = window.localStorage.getItem(DAILY_CHECKIN_STORAGE_KEY);
    if (!rawValue) return { streakCount: 0, lastCheckInDate: "" };
    const parsedValue = JSON.parse(rawValue);
    return {
      streakCount: Number.isFinite(Number(parsedValue?.streakCount)) && Number(parsedValue?.streakCount) > 0 ? Number(parsedValue.streakCount) : 0,
      lastCheckInDate: String(parsedValue?.lastCheckInDate || ""),
      completionPercent: Number.isFinite(Number(parsedValue?.completionPercent)) && Number(parsedValue?.completionPercent) > 0 ? Number(parsedValue.completionPercent) : 0,
      checkInQuality: String(parsedValue?.checkInQuality || ""),
      completedTodayTasks: Number.isFinite(Number(parsedValue?.completedTodayTasks)) && Number(parsedValue?.completedTodayTasks) > 0 ? Number(parsedValue.completedTodayTasks) : 0,
      totalTodayTasks: Number.isFinite(Number(parsedValue?.totalTodayTasks)) && Number(parsedValue?.totalTodayTasks) > 0 ? Number(parsedValue.totalTodayTasks) : 0,
    };
  } catch (error) {
    return { streakCount: 0, lastCheckInDate: "", completionPercent: 0, checkInQuality: "", completedTodayTasks: 0, totalTodayTasks: 0 };
  }
}

function getCheckInQuality(completionPercent) {
  if (completionPercent >= 80) return "strong";
  if (completionPercent >= 50) return "solid";
  return "short";
}

function getCheckInMessage(completionPercent) {
  if (completionPercent >= 80) return "Strong day. You completed most of today's plan.";
  if (completionPercent >= 50) return "Solid progress. You moved forward today.";
  return "Short day. Tomorrow we catch up from the highest-priority pending work.";
}

function storeDailyCheckIn(value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DAILY_CHECKIN_STORAGE_KEY, JSON.stringify(value));
}

function buildPlanKey({ examType, examDate, studyHours, fullPlan }) {
  return hashString(JSON.stringify({ examType, examDate, studyHours, fullPlan }));
}

function getFounderMode() {
  if (typeof window === "undefined") return false;
  try {
    const url = new URL(window.location.href);
    const queryValue = url.searchParams.get(FOUNDER_MODE_QUERY_KEY);
    if (queryValue === FOUNDER_MODE_QUERY_VALUE) {
      window.localStorage.setItem(FOUNDER_MODE_STORAGE_KEY, "true");
      url.searchParams.delete(FOUNDER_MODE_QUERY_KEY);
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      return true;
    }
    return window.localStorage.getItem(FOUNDER_MODE_STORAGE_KEY) === "true";
  } catch (error) {
    return false;
  }
}

function buildApiCandidates() {
  const rawValues = [
    typeof process !== "undefined" ? process.env.REACT_APP_API_ENDPOINT : "",
    typeof process !== "undefined" ? process.env.REACT_APP_API_URL : "",
    typeof process !== "undefined" ? process.env.REACT_APP_BACKEND_URL : "",
    DEFAULT_BACKEND_BASE,
  ].filter(Boolean);
  const candidates = [];
  rawValues.forEach((value) => {
    const normalized = String(value).trim();
    if (!normalized) return;
    if (/\/study-plan\/?$/i.test(normalized)) { candidates.push(normalized); return; }
    candidates.push(`${normalized.replace(/\/$/, "")}/study-plan`);
  });
  return [...new Set(candidates)];
}

function cleanLine(value) {
  return String(value || "").replace(/\*\*/g, "").replace(/^[-*\u2022\d.)\s]+/, "").trim();
}

function uniqueLines(items) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function toTaskList(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return uniqueLines(value.flatMap((entry) => {
      if (!entry) return [];
      if (typeof entry === "string") { const cleaned = cleanLine(entry); return cleaned ? [cleaned] : []; }
      if (typeof entry === "object") {
        return [...toTaskList(entry.task), ...toTaskList(entry.title), ...toTaskList(entry.topic), ...toTaskList(entry.label), ...toTaskList(entry.description), ...toTaskList(entry.text)];
      }
      return [];
    }));
  }
  if (typeof value === "string") {
    return uniqueLines(value.split(/\n+/).map(cleanLine).filter(Boolean));
  }
  return [];
}

function formatDayTitle(value, index) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return `Day ${index + 1}`;
  if (/^day\s*\d+/i.test(cleaned)) return cleaned;
  return `Day ${index + 1}: ${cleaned}`;
}

function countPlanTasks(item) {
  if (!item) return 0;
  const sectionTasks = Array.isArray(item.sections) ? item.sections.reduce((total, section) => total + section.tasks.length, 0) : 0;
  return sectionTasks || item.tasks.length;
}

function getTaskOwnerTitle(item) {
  return item.storageTitle || item.title || "Study Day";
}

function getRenderableSections(item) {
  if (Array.isArray(item.sections) && item.sections.length > 0) return item.sections;
  if (Array.isArray(item.tasks) && item.tasks.length > 0) return [{ title: "Tasks", tasks: item.tasks }];
  return [];
}

function buildTaskId(planKey, itemTitle, sectionTitle, task) {
  return hashString([planKey, itemTitle, sectionTitle, task].join("::"));
}

function collectPlanTasks(planItems, planKey) {
  if (!planKey || !Array.isArray(planItems)) return [];
  return planItems.flatMap((item) => {
    const itemTitle = getTaskOwnerTitle(item);
    return getRenderableSections(item).flatMap((section) =>
      section.tasks.map((task) => ({ id: buildTaskId(planKey, itemTitle, section.title, task), itemTitle, sectionTitle: section.title, task }))
    );
  });
}

function extractDaySortValue(label) {
  const match = String(label || "").match(/day\s*(\d+)/i);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function buildPendingDayGroups(pendingTasks) {
  const dayMap = new Map();
  pendingTasks.forEach((task) => {
    const existingDay = dayMap.get(task.itemTitle) || { dayTitle: task.itemTitle, daySortValue: extractDaySortValue(task.itemTitle), sections: new Map(), tasks: [] };
    const existingSection = existingDay.sections.get(task.sectionTitle) || [];
    existingSection.push(task.task);
    existingDay.sections.set(task.sectionTitle, uniqueLines(existingSection));
    existingDay.tasks.push(task);
    dayMap.set(task.itemTitle, existingDay);
  });
  return [...dayMap.values()].sort((a, b) => a.daySortValue - b.daySortValue).map((day) => ({
    dayTitle: day.dayTitle,
    taskCount: day.tasks.length,
    sections: [...day.sections.entries()].map(([title, tasks]) => ({ title, tasks })),
  }));
}

function buildSectionsFromLines(lines) {
  const sections = [];
  let currentSection = null;
  lines.forEach((line) => {
    const cleaned = cleanLine(line);
    if (!cleaned) return;
    const sectionMatch = cleaned.match(SECTION_HEADING_PATTERN);
    if (sectionMatch) {
      currentSection = { title: sectionMatch[1].trim(), tasks: sectionMatch[2] ? [sectionMatch[2].trim()] : [] };
      sections.push(currentSection);
      return;
    }
    if (currentSection) currentSection.tasks.push(cleaned);
  });
  return sections.map((section) => ({ ...section, tasks: uniqueLines(section.tasks.map(cleanLine).filter(Boolean)) })).filter((section) => section.tasks.length > 0);
}

function normalizeTextSection(section, index) {
  const lines = String(section || "").replace(/\r/g, "").split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return null;
  const firstLine = cleanLine(lines[0]);
  const taskLines = lines.slice(1).map(cleanLine).filter(Boolean);
  const looksLikeDayHeading = /^day\s*\d+/i.test(firstLine);
  const inlineSummary = looksLikeDayHeading ? firstLine.replace(/^day\s*\d+\s*[:-]?\s*/i, "").trim() : "";
  const sections = buildSectionsFromLines(lines.slice(1));
  return {
    id: `plan-item-${index}`,
    title: looksLikeDayHeading ? firstLine : `Day ${index + 1}`,
    storageTitle: looksLikeDayHeading ? firstLine : `Day ${index + 1}`,
    summary: taskLines.length ? "" : inlineSummary,
    sections,
    tasks: taskLines.length ? taskLines : looksLikeDayHeading ? [] : lines.map(cleanLine).filter(Boolean),
  };
}

function normalizePlanItem(item, index) {
  if (!item) return null;
  if (typeof item === "string") return normalizeTextSection(item, index);
  if (typeof item !== "object") return null;
  const title = formatDayTitle(item.title || item.day || item.heading || item.label || item.name, index);
  const tasks = uniqueLines([...toTaskList(item.tasks), ...toTaskList(item.topics), ...toTaskList(item.items), ...toTaskList(item.plan), ...toTaskList(item.content), ...toTaskList(item.subtopics)]);
  const summary = String(item.summary || item.description || item.note || item.focus || item.overview || "").trim() || "";
  const sections = [...buildSectionsFromLines(toTaskList(item.tasks)), ...buildSectionsFromLines(toTaskList(item.plan)), ...buildSectionsFromLines(toTaskList(item.content))];
  return {
    id: `plan-item-${index}`,
    title,
    storageTitle: title,
    summary: tasks.length ? summary : "",
    sections,
    tasks: tasks.length ? tasks : toTaskList(summary),
  };
}

function normalizePlan(rawPlan) {
  if (!rawPlan) return [];
  if (Array.isArray(rawPlan)) return rawPlan.map(normalizePlanItem).filter(Boolean);
  if (typeof rawPlan === "string") {
    const cleaned = rawPlan.trim().replace(/\*\*/g, "");
    if (!cleaned) return [];
    const matchedDays = cleaned.match(/(?:^|\n)(Day\s*\d+[^\n]*[\s\S]*?)(?=\nDay\s*\d+\b|$)/gi);
    const sections = matchedDays && matchedDays.length ? matchedDays.map((entry) => entry.trim()) : cleaned.split(/\n\s*\n+/).map((entry) => entry.trim()).filter(Boolean);
    return sections.map(normalizePlanItem).filter(Boolean);
  }
  if (typeof rawPlan === "object") {
    if (rawPlan.days || rawPlan.schedule || rawPlan.items) return normalizePlan(rawPlan.days || rawPlan.schedule || rawPlan.items);
    if (rawPlan.plan || rawPlan.studyPlan || rawPlan.fullPlan || rawPlan.full_plan) return normalizePlan(rawPlan.plan || rawPlan.studyPlan || rawPlan.fullPlan || rawPlan.full_plan);
    return Object.values(rawPlan).map(normalizePlanItem).filter(Boolean);
  }
  return [];
}

function normalizeTodayPlan(rawTodayPlan, fallbackFullPlan) {
  if (!rawTodayPlan) return fallbackFullPlan[0] || null;
  if (Array.isArray(rawTodayPlan)) return normalizePlan(rawTodayPlan)[0] || fallbackFullPlan[0] || null;
  if (typeof rawTodayPlan === "string") {
    const parsed = normalizePlan(rawTodayPlan);
    if (parsed[0]) return { ...parsed[0], storageTitle: parsed[0].storageTitle || parsed[0].title, title: "Today's Plan" };
    const tasks = toTaskList(rawTodayPlan);
    return { id: "today-plan", title: "Today's Plan", storageTitle: fallbackFullPlan[0]?.storageTitle || "Day 1", summary: "", tasks };
  }
  if (typeof rawTodayPlan === "object") {
    const parsed = normalizePlanItem(rawTodayPlan, 0);
    if (!parsed) return fallbackFullPlan[0] || null;
    return { ...parsed, storageTitle: parsed.storageTitle || parsed.title, title: "Today's Plan" };
  }
  return fallbackFullPlan[0] || null;
}

async function requestPlan(payload, token) {
  const endpoints = buildApiCandidates();
  let lastError = new Error("Unable to connect to ExamPilot right now.");
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        lastError = new Error(data.error || data.message || `Plan generation failed with status ${response.status}.`);
        continue;
      }
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Something went wrong while generating the plan.");
    }
  }
  throw lastError;
}

// ─── Plan Card ──────────────────────────────────────────────────────────────────
function PlanCard({ item, highlight, planKey, progressMap, onToggleTask }) {
  const taskCount = countPlanTasks(item);
  const itemTitle = getTaskOwnerTitle(item);
  const renderSections = getRenderableSections(item);

  return (
    <div style={{ ...styles.planCard, borderColor: highlight ? "rgba(94, 234, 212, 0.35)" : "rgba(255, 255, 255, 0.08)", boxShadow: highlight ? "0 18px 50px rgba(15, 118, 110, 0.25)" : "0 14px 40px rgba(0, 0, 0, 0.28)" }}>
      <div style={styles.planCardHeader}>
        <div>
          <p style={styles.planEyebrow}>{highlight ? "Free Today View" : "Study Day"}</p>
          <h3 style={styles.planTitle}>{item.title}</h3>
        </div>
        {taskCount > 0 ? <span style={styles.taskCount}>{taskCount} tasks</span> : null}
      </div>
      {item.summary ? <p style={styles.planSummary}>{item.summary}</p> : null}
      {renderSections.length > 0 ? (
        <div style={styles.sectionStack}>
          {renderSections.map((section) => (
            <div key={`${item.id}-${section.title}`} style={styles.sectionCard}>
              <p style={styles.sectionTitle}>{section.title}</p>
              <ul style={styles.taskList}>
                {section.tasks.map((task, index) => {
                  const taskId = buildTaskId(planKey, itemTitle, section.title, task);
                  const checked = Boolean(progressMap[taskId]);
                  return (
                    <li key={`${item.id}-${section.title}-${index}`} style={{ ...styles.taskItem, ...(checked ? styles.taskItemDone : {}) }}>
                      <label style={styles.taskLabel}>
                        <input type="checkbox" checked={checked} onChange={() => onToggleTask(taskId)} style={styles.taskCheckbox} />
                        <span style={checked ? styles.taskTextDone : undefined}>{task}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ) : item.tasks.length > 0 ? (
        <ul style={styles.taskList}>
          {item.tasks.map((task, index) => {
            const taskId = buildTaskId(planKey, itemTitle, "Tasks", task);
            const checked = Boolean(progressMap[taskId]);
            return (
              <li key={`${item.id}-task-${index}`} style={{ ...styles.taskItem, ...(checked ? styles.taskItemDone : {}) }}>
                <label style={styles.taskLabel}>
                  <input type="checkbox" checked={checked} onChange={() => onToggleTask(taskId)} style={styles.taskCheckbox} />
                  <span style={checked ? styles.taskTextDone : undefined}>{task}</span>
                </label>
              </li>
            );
          })}
        </ul>
      ) : (
        <p style={styles.emptyCopy}>No tasks were returned for this section.</p>
      )}
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────────
export default function App() {
  // ── Auth state ──
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  if (code) {
    supabase.auth.exchangeCodeForSession(code).then(({ data }) => {
      if (data?.session) setSession(data.session);
      window.history.replaceState({}, document.title, window.location.pathname);
    });
  }

  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setAuthLoading(false);
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
    setAuthLoading(false);
  });

  return () => subscription.unsubscribe();
}, []);
  // ── App state ──
  const savedSession = loadStoredPlanSession();
  const resultRef = useRef(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [viewMode, setViewMode] = useState("today");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [founderMode] = useState(getFounderMode);
  const [planUsageCount, setPlanUsageCount] = useState(getStoredPlanUsageCount);
  const [dailyCheckIn, setDailyCheckIn] = useState(loadDailyCheckIn);
  const [todayConfidence, setTodayConfidence] = useState(0);
  const [learningReflection, setLearningReflection] = useState(EMPTY_REFLECTION);
  const [reflectionSubmitted, setReflectionSubmitted] = useState(false);
  const [resumeSession, setResumeSession] = useState(savedSession);
  const [result, setResult] = useState(EMPTY_RESULT);
  const [progressMap, setProgressMap] = useState(loadStoredProgress(""));
  const [showUpcomingDays, setShowUpcomingDays] = useState(false);

  // ── BETA: full access for all users ──
  const IS_BETA = true;

  const previewPlan = result.fullPlan.slice(0, FREE_PREVIEW_DAYS);
  const hiddenDayCount = Math.max(result.fullPlan.length - FREE_PREVIEW_DAYS, 0);
  const hasPlan = result.fullPlan.length > 0 || Boolean(result.todayPlan);
  const hasResumeSession = Boolean(resumeSession?.result?.planKey) && !hasPlan;
  const todayPlan = result.todayPlan || result.fullPlan[0] || null;
  const resultMeta = result.meta || null;
  const freeFullPlansLeft = Math.max(FREE_FULL_PLAN_LIMIT - planUsageCount, 0);
  const hasFullPlanAccess = IS_BETA || founderMode || (planUsageCount > 0 && planUsageCount <= FREE_FULL_PLAN_LIMIT);
  const trackablePlanItems = hasFullPlanAccess ? result.fullPlan : previewPlan;
  const allPlanTasks = collectPlanTasks(trackablePlanItems, result.planKey);
  const totalTaskCount = allPlanTasks.length;
  const pendingTasks = allPlanTasks.filter((task) => !progressMap[task.id]);
  const pendingDayGroups = buildPendingDayGroups(pendingTasks);
  const recoveryTaskLimit = Math.max(2, Math.min(5, Number(resultMeta?.studyHours || formData.studyHours) || 3));
  const priorityRecoveryTasks = pendingTasks.slice(0, recoveryTaskLimit);
  const isLowTimeMode = typeof result.daysLeft === "number" && result.daysLeft <= 3;
  const todayPlanTasks = todayPlan ? collectPlanTasks([todayPlan], result.planKey) : [];
  const completedTodayTaskCount = todayPlanTasks.filter((task) => progressMap[task.id]).length;
  const totalTodayTaskCount = todayPlanTasks.length;
  const pendingTodayTaskCount = Math.max(totalTodayTaskCount - completedTodayTaskCount, 0);
  const todayProgressPercent = totalTodayTaskCount ? Math.round((completedTodayTaskCount / totalTodayTaskCount) * 100) : 0;
  const todayProgressLabel = completedTodayTaskCount === 0 ? "Ready to start" : `${completedTodayTaskCount} / ${totalTodayTaskCount} today`;
  const backlogLabel = totalTaskCount ? `${totalTaskCount} tasks across ${trackablePlanItems.length} day${trackablePlanItems.length === 1 ? "" : "s"}` : "";
  const todayDateKey = getISTDateKey();
  const yesterdayDateKey = getYesterdayISTDateKey();
  const hasCheckedInToday = dailyCheckIn.lastCheckInDate === todayDateKey;
  const streakCount = dailyCheckIn.lastCheckInDate === todayDateKey || dailyCheckIn.lastCheckInDate === yesterdayDateKey ? dailyCheckIn.streakCount : 0;
  const unlockedRewardCount = STREAK_REWARD_MILESTONES.filter((milestone) => streakCount >= milestone.days).length;
  const nextRewardMilestone = STREAK_REWARD_MILESTONES.find((milestone) => streakCount < milestone.days) || null;
  const rewardProgressPercent = nextRewardMilestone ? Math.min(100, Math.round((streakCount / nextRewardMilestone.days) * 100)) : 100;
  const confidenceLabel = todayConfidence <= 0 ? "Not rated yet" : todayConfidence <= 2 ? "Needs revision" : todayConfidence === 3 ? "Moderate understanding" : "Strong understanding";
  const confidenceCopy = todayConfidence <= 0 ? "After finishing today's tasks, rate your confidence so ExamPilot can start understanding what feels weak or strong." : todayConfidence <= 2 ? "Low confidence signal detected. Revisit today's key topics and practice again before moving ahead." : todayConfidence === 3 ? "You are partly confident. One more revision or practice round should strengthen this topic." : "Strong confidence signal detected. You can move ahead, and later ExamPilot can reduce extra revision on strong topics.";
  const hasCompletedReflection = Boolean(learningReflection.hardestPart) && Boolean(learningReflection.practiceCount) && Boolean(learningReflection.supportNeed) && Boolean(learningReflection.weakTask);
  const needsFollowUpQuestions = todayConfidence > 0 && todayConfidence < 5;
  const canRateConfidence = hasCheckedInToday || completedTodayTaskCount > 0;
  const adaptiveGuidance = buildAdaptiveGuidance(todayConfidence, learningReflection);
  const canMarkTodayDone = totalTodayTaskCount > 0 && completedTodayTaskCount > 0 && !hasCheckedInToday;
  const checkInQuality = hasCheckedInToday && dailyCheckIn.checkInQuality ? dailyCheckIn.checkInQuality : getCheckInQuality(todayProgressPercent);
  const checkInPercent = hasCheckedInToday && dailyCheckIn.completionPercent ? dailyCheckIn.completionPercent : todayProgressPercent;

  useEffect(() => { setProgressMap(loadStoredProgress(result.planKey)); }, [result.planKey]);
  useEffect(() => { setTodayConfidence(loadStoredConfidence(result.planKey)); }, [result.planKey]);
  useEffect(() => { setLearningReflection(loadStoredReflection(result.planKey)); setReflectionSubmitted(false); }, [result.planKey]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const syllabus = formData.syllabus.trim();
      const studyHours = Number(formData.studyHours);
      if (!syllabus || !formData.examDate || !studyHours) throw new Error("Please fill in syllabus, exam date, and study hours.");
      const payload = { examType: formData.examType, syllabus, examDate: formData.examDate, studyHours, hoursPerDay: studyHours, studyHoursPerDay: studyHours, ...extra };
      if (!syllabus || !formData.examDate || !studyHours) throw new Error("Please fill in syllabus, exam date, and study hours.");
      const selectedDate = new Date(`${formData.examDate}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        throw new Error("Exam date must be today or a future date. Please check your selection.");
      }
      const data = await requestPlan(payload, session?.access_token);
      const rawFullPlan = data.fullPlan || data.full_plan || data.plan || data.studyPlan || data.study_plan || data.result || data.output || "";
      const fullPlan = normalizePlan(rawFullPlan);
      const todayPlanData = normalizeTodayPlan(data.todayPlan || data.today_plan || data.today || data.todayStudyPlan, fullPlan);
      if (!fullPlan.length && !todayPlanData) throw new Error("Plan generated, but the response format was empty.");
      const nextUsageCount = planUsageCount + 1;
      const normalizedFormData = { ...formData, syllabus, studyHours: String(studyHours) };
      const planKey = buildPlanKey({ examType: normalizedFormData.examType, examDate: normalizedFormData.examDate, studyHours: normalizedFormData.studyHours, fullPlan });
      const nextResult = { fullPlan, todayPlan: todayPlanData, daysLeft: typeof data.daysLeft === "number" ? data.daysLeft : null, planKey, meta: { examType: normalizedFormData.examType, examDate: normalizedFormData.examDate, studyHours: normalizedFormData.studyHours } };

      // Save plan to Supabase if user is logged in
      if (session?.user?.id) {
        supabase.from("plans").insert({
          user_id: session.user.id,
          exam_type: normalizedFormData.examType,
          exam_date: normalizedFormData.examDate,
          hours_per_day: Number(normalizedFormData.studyHours),
          syllabus: normalizedFormData.syllabus,
          plan_json: nextResult,
        }).then(({ error }) => { if (error) console.error("Supabase save error:", error); });
      }

      setPlanUsageCount(nextUsageCount);
      storePlanUsageCount(nextUsageCount);
      setFormData(normalizedFormData);
      setResult(nextResult);
      const nextSession = { result: nextResult };
      setResumeSession(nextSession);
      storePlanSession(nextSession);
      setViewMode("today");
      setShowUpcomingDays(false);
      setTimeout(() => { resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 150);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to generate the study plan right now.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleReset() {
    setResult(EMPTY_RESULT); setFormData(DEFAULT_FORM_DATA); setProgressMap({});
    setResumeSession(null); clearStoredPlanSession(); setViewMode("today");
    setShowUpcomingDays(false); setError("");
  }
  function handleResumeLastPlan() {
    if (!resumeSession?.result) return;
    setResult(resumeSession.result);
    setProgressMap(loadStoredProgress(resumeSession.result.planKey));
    setViewMode("today"); setShowUpcomingDays(false);
    setTimeout(() => { resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 120);
  }

  function handleStartFresh() {
    setResumeSession(null); clearStoredPlanSession(); setResult(EMPTY_RESULT);
    setFormData(DEFAULT_FORM_DATA); setProgressMap({}); setViewMode("today");
    setShowUpcomingDays(false); setError("");
  }

  function handleToggleTask(taskId) {
    setProgressMap((current) => {
      const next = { ...current, [taskId]: !current[taskId] };
      storeProgress(result.planKey, next);
      return next;
    });
  }

  function handleDailyCheckIn() {
    if (!canMarkTodayDone) return;
    const completionPercent = todayProgressPercent;
    const nextValue = {
      streakCount: dailyCheckIn.lastCheckInDate === yesterdayDateKey ? dailyCheckIn.streakCount + 1 : 1,
      lastCheckInDate: todayDateKey, completionPercent,
      checkInQuality: getCheckInQuality(completionPercent),
      completedTodayTasks: completedTodayTaskCount,
      totalTodayTasks: totalTodayTaskCount,
    };
    setDailyCheckIn(nextValue);
    storeDailyCheckIn(nextValue);
    // Save check-in to Supabase
    if (session?.user?.id && result.planKey) {
      supabase.from("checkins").insert({
        user_id: session.user.id,
        date: todayDateKey,
        completed_tasks: Object.keys(progressMap).filter((k) => progressMap[k]),
        confidence: todayConfidence || null,
        reflection: learningReflection.otherIssue || null,
      }).then(({ error }) => { if (error) console.error("Checkin save error:", error); });
      supabase.from("streaks").upsert({
        user_id: session.user.id,
        current_streak: nextValue.streakCount,
        longest_streak: Math.max(nextValue.streakCount, dailyCheckIn.streakCount || 0),
        last_checkin_date: todayDateKey,
        updated_at: new Date().toISOString(),
      }).then(({ error }) => { if (error) console.error("Streak save error:", error); });
    }
  }

  function handleConfidenceSelect(score) {
    if (!canRateConfidence || !result.planKey) return;
    setTodayConfidence(score);
    storeConfidence(result.planKey, score);
    if (score === 5) { setLearningReflection(EMPTY_REFLECTION); storeReflection(result.planKey, EMPTY_REFLECTION); }
    setReflectionSubmitted(false);
  }

  function handleReflectionChange(field, value) {
    if (!result.planKey) return;
    setReflectionSubmitted(false);
    setLearningReflection((current) => {
      const next = { ...current, [field]: value };
      storeReflection(result.planKey, next);
      return next;
    });
  }

  function handleReflectionSubmit() {
  if (!hasCompletedReflection || reflectionSubmitted) return;   // ← added reflectionSubmitted guard
  setReflectionSubmitted(true);

  if (session?.user?.id && todayConfidence > 0 && todayConfidence < 5 && todayPlan) {
    supabase.from("weak_topics").insert({
      user_id: session.user.id,
      topic: learningReflection.weakTask || "General",   // ← changed from sections[0]/tasks[0]
      subject: resultMeta?.examType || formData.examType,
      confidence_score: todayConfidence,
      flagged_at: new Date().toISOString(),
    }).then(({ error }) => { if (error) console.error("Weak topic save error:", error); });
  }
}
function handleRegenerateWithWeakTopics() {
  const completedSummary = buildCompletedSummary();
  const confirmed = window.confirm(`${result.daysLeft} day(s) left until your exam, ${formData.studyHours} hrs/day. Your plan will be rebuilt for the remaining time — topics you've already completed won't be repeated. Continue?`);
  if (!confirmed) return;
  handleSubmit({ preventDefault: () => {} }, { completedSummary });
}
  function buildCompletedSummary() {
  const allTasks = collectPlanTasks(trackablePlanItems, result.planKey);
  const done = allTasks.filter((t) => progressMap[t.id]).map((t) => t.task);
  return uniqueLines(done).join(", ");
}

  // ── Loading screen ──
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#070b14" }}>
        <p style={{ color: "#5eead4", fontSize: "16px", fontFamily: "'Inter', sans-serif" }}>Loading ExamPilot...</p>
      </div>
    );
  }

  // ── Auth screen ──
  if (!session) return <Auth />;

  // ── Main app ──
  return (
    <div style={styles.appShell}>
      <div style={styles.overlay} />

      <main style={styles.container}>
        <section style={styles.heroCard}>
          <div style={styles.brandPill}>ExamPilot</div>
          <h1 style={styles.heroTitle}>Know exactly what to study today.</h1>
          <p style={styles.heroSubtitle}>
            Turn a stressful syllabus into a daily action plan built around your exam date and available study hours.
          </p>
          {/* Beta Banner */}
          <div style={{ marginTop: "16px", padding: "12px 16px", borderRadius: "12px", background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.25)" }}>
            <p style={{ margin: 0, color: "#5eead4", fontSize: "14px", lineHeight: 1.5 }}>
              🎉 <strong>Beta access — full plan unlocked for free.</strong> You are one of our early users. All features are free right now. We will notify you before anything changes.
            </p>
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Generate your personalized study plan</h2>
            </div>
            {/* Logout button */}
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "8px 14px", color: "#94a3b8", fontSize: "13px", cursor: "pointer" }}
            >
              Sign out
            </button>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGrid}>
              <label style={styles.label}>
                Exam Type
                <select name="examType" value={formData.examType} onChange={handleChange} style={styles.select}>
                  <option value="JEE">JEE</option>
                  <option value="NEET">NEET</option>
                  <option value="UPSC">UPSC</option>
                  <option value="College Exams">College Exams</option>
                  <option value="School/Board Exams">School/Board Exams</option>
                </select>
              </label>
              <label style={styles.label}>
                Exam Date
                <input type="date" name="examDate" value={formData.examDate} onChange={handleChange} style={styles.input} required />
              </label>
              <label style={styles.label}>
                Study Hours / Day
                <input type="number" name="studyHours" value={formData.studyHours} onChange={handleChange} placeholder="e.g. 3" min="1" max="16" style={styles.input} required />
              </label>
            </div>

            <label style={styles.label}>
              Syllabus
              <textarea name="syllabus" value={formData.syllabus} onChange={handleChange} placeholder="Paste your syllabus, units, or exam topics here..." style={styles.textarea} rows={9} required />
            </label>

            <div style={styles.buttonRow}>
              <button type="submit" disabled={loading} style={styles.primaryButton}>
                {loading ? "Generating..." : "Generate Study Plan"}
              </button>
              {hasPlan ? (
                <button type="button" onClick={handleReset} style={styles.secondaryButton}>New Plan</button>
              ) : null}
            </div>

            <p style={styles.helperText}>ExamPilot shows Today Plan first so students can start fast without feeling overwhelmed.</p>
            {founderMode ? (
              <p style={styles.adminText}>Founder mode is enabled in this browser. Full plans stay unlocked for manual delivery after payment.</p>
            ) : null}
          </form>

          {hasResumeSession ? (
            <div style={styles.resumeCard}>
              <div>
                <p style={styles.resumeEyebrow}>Saved Browser Session</p>
                <h3 style={styles.resumeTitle}>A previous study plan is available</h3>
                <p style={styles.resumeCopy}>This browser has an older saved plan. Resume or start fresh.</p>
              </div>
              <div style={styles.resumeActions}>
                <button type="button" onClick={handleResumeLastPlan} style={styles.resumePrimaryButton}>Resume last plan</button>
                <button type="button" onClick={handleStartFresh} style={styles.resumeSecondaryButton}>Start fresh</button>
              </div>
            </div>
          ) : null}

          {error ? <div style={styles.errorBox}>{error}</div> : null}
        </section>

        {hasPlan ? (
          <section ref={resultRef} style={styles.panel}>
            <div style={styles.resultsHeader}>
              <div>
                <p style={styles.panelEyebrow}>Plan Output</p>
                <h2 style={styles.panelTitle}>Focused today, full roadmap when needed</h2>
              </div>
              <div style={styles.toggleWrap}>
                <button type="button" onClick={() => setViewMode("today")} style={{ ...styles.toggleButton, ...(viewMode === "today" ? styles.toggleButtonActive : {}) }}>Today Plan</button>
                <button type="button" onClick={() => setViewMode("full")} style={{ ...styles.toggleButton, ...(viewMode === "full" ? styles.toggleButtonActive : {}) }}>Full Roadmap</button>
              </div>
            </div>

            <div style={styles.statsRow}>
              <div style={styles.statCard}><span style={styles.statLabel}>Exam Type</span><strong style={styles.statValue}>{resultMeta?.examType || formData.examType}</strong></div>
              <div style={styles.statCard}><span style={styles.statLabel}>Study Hours</span><strong style={styles.statValue}>{resultMeta?.studyHours || formData.studyHours}/day</strong></div>
              <div style={styles.statCard}><span style={styles.statLabel}>Days Left</span><strong style={styles.statValue}>{result.daysLeft !== null ? result.daysLeft : "Calculated in plan"}</strong></div>
              <div style={styles.statCard}><span style={styles.statLabel}>Access</span><strong style={styles.statValue} style={{ color: "#5eead4" }}>Beta — Full Free</strong></div>
            </div>

            <div style={styles.accountabilityCard}>
              <div style={styles.accountabilityHeader}>
                <div>
                  <p style={styles.accountabilityEyebrow}>Daily Accountability</p>
                  <h3 style={styles.accountabilityTitle}>Build the habit, not just the plan</h3>
                </div>
                <div style={styles.streakBadge}>
                  <span style={styles.streakValue}>{streakCount}</span>
                  <span style={styles.streakLabel}>day streak</span>
                </div>
              </div>

              <div style={styles.accountabilityGrid}>
                <div style={styles.accountabilityMetric}>
                  <span style={styles.accountabilityMetricLabel}>Today&apos;s Plan</span>
                  <strong style={styles.accountabilityMetricValue}>{completedTodayTaskCount} / {totalTodayTaskCount} tasks done</strong>
                </div>
                <div style={styles.accountabilityMetric}>
                  <span style={styles.accountabilityMetricLabel}>Check-in Status</span>
                  <strong style={styles.accountabilityMetricValue}>{hasCheckedInToday ? `Checked in today - ${checkInPercent}%` : "Pending today"}</strong>
                  {hasCheckedInToday ? (
                    <span style={{ ...styles.checkInTag, ...(checkInQuality === "strong" ? styles.checkInTagStrong : checkInQuality === "solid" ? styles.checkInTagSolid : styles.checkInTagShort) }}>
                      {checkInQuality === "strong" ? "Strong day" : checkInQuality === "solid" ? "Solid progress" : "Partial day"}
                    </span>
                  ) : null}
                </div>
              </div>

              <p style={styles.accountabilityCopy}>
                {hasCheckedInToday ? `${getCheckInMessage(checkInPercent)} Come back tomorrow and keep the streak alive.` : canMarkTodayDone ? `${todayProgressPercent}% of today's plan is done. Check in now and continue from pending work tomorrow.` : "Complete at least 1 task from Today's Plan to check in and keep your study habit alive."}
              </p>

              <button type="button" onClick={handleDailyCheckIn} disabled={!canMarkTodayDone} style={{ ...styles.accountabilityButton, ...(!canMarkTodayDone ? styles.accountabilityButtonDisabled : {}) }}>
                {hasCheckedInToday ? "Checked in today" : canMarkTodayDone ? "Check in today" : "Complete 1 task to check in"}
              </button>

              <div style={styles.rewardsCard}>
                <div style={styles.rewardsHeader}>
                  <div>
                    <p style={styles.rewardsEyebrow}>Streak Rewards</p>
                    <h4 style={styles.rewardsTitle}>{nextRewardMilestone ? `${nextRewardMilestone.days - streakCount} more day${nextRewardMilestone.days - streakCount === 1 ? "" : "s"} to your next reward` : "All current streak rewards unlocked"}</h4>
                  </div>
                  <span style={styles.rewardsCount}>{unlockedRewardCount}/{STREAK_REWARD_MILESTONES.length} unlocked</span>
                </div>
                <p style={styles.rewardsCopy}>{nextRewardMilestone ? `Stay consistent and keep checking in daily. Your next unlock is the ${nextRewardMilestone.days}-day ${nextRewardMilestone.title}.` : "You unlocked every current reward. Next we can add stronger milestone perks and streak bonuses."}</p>
                <div style={styles.rewardProgressTrack}><div style={{ ...styles.rewardProgressFill, width: `${rewardProgressPercent}%` }} /></div>
                <div style={styles.rewardMilestoneGrid}>
                  {STREAK_REWARD_MILESTONES.map((milestone) => {
                    const unlocked = streakCount >= milestone.days;
                    return (
                      <div key={milestone.days} style={{ ...styles.rewardMilestoneCard, ...(unlocked ? styles.rewardMilestoneCardUnlocked : {}) }}>
                        <div style={styles.rewardMilestoneTop}>
                          <span style={styles.rewardMilestoneDays}>{milestone.days} days</span>
                          <span style={{ ...styles.rewardMilestoneStatus, ...(unlocked ? styles.rewardMilestoneStatusUnlocked : {}) }}>{unlocked ? "Unlocked" : "Locked"}</span>
                        </div>
                        <h5 style={styles.rewardMilestoneTitle}>{milestone.title}</h5>
                        <p style={styles.rewardMilestoneCopy}>{milestone.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={styles.confidenceCard}>
                <div style={styles.confidenceHeader}>
                  <div>
                    <p style={styles.confidenceEyebrow}>Learning Signal</p>
                    <h4 style={styles.confidenceTitle}>Rate how confident you feel after today&apos;s work</h4>
                  </div>
                  <span style={styles.confidenceStatus}>{confidenceLabel}</span>
                </div>
                <p style={styles.confidenceCopy}>{confidenceCopy}</p>
                <div style={styles.confidenceScale}>
                  {[1, 2, 3, 4, 5].map((score) => {
                    const active = todayConfidence === score;
                    const disabled = !canRateConfidence;
                    return (
                      <button key={score} type="button" onClick={() => handleConfidenceSelect(score)} disabled={disabled} style={{ ...styles.confidenceButton, ...(active ? styles.confidenceButtonActive : {}), ...(disabled ? styles.confidenceButtonDisabled : {}) }}>{score}</button>
                    );
                  })}
                </div>
                <p style={styles.confidenceLegend}>1 = very weak, 3 = average, 5 = very strong</p>

                {todayConfidence === 5 ? (
                  <div style={styles.adaptiveCard}>
                    <p style={styles.adaptiveEyebrow}>Adaptive Guidance</p>
                    <h5 style={styles.adaptiveTitle}>{adaptiveGuidance.title}</h5>
                    <p style={styles.adaptiveBody}>{adaptiveGuidance.body}</p>
                    <p style={styles.adaptiveAction}>{adaptiveGuidance.action}</p>
                  </div>
                ) : null}

                {needsFollowUpQuestions ? (
                  <div style={styles.followUpCard}>
                    <p style={styles.followUpEyebrow}>Confidence Follow-up</p>
                    <h5 style={styles.followUpTitle}>Before moving forward, answer these so ExamPilot can guide your next step</h5>
                    <div style={styles.followUpGrid}>
                      <ReflectionOptionGroup label="What felt hardest?" value={learningReflection.hardestPart} options={HARDEST_PART_OPTIONS} onSelect={(v) => handleReflectionChange("hardestPart", v)} />
                      <ReflectionOptionGroup label="How much practice did you do?" value={learningReflection.practiceCount} options={PRACTICE_COUNT_OPTIONS} onSelect={(v) => handleReflectionChange("practiceCount", v)} />
                      <ReflectionOptionGroup label="What support do you need next?" value={learningReflection.supportNeed} options={SUPPORT_NEED_OPTIONS} onSelect={(v) => handleReflectionChange("supportNeed", v)} />
                      <ReflectionOptionGroup label="Which specific task was this about?" value={learningReflection.weakTask} options={todayPlanTasks.map((t) => ({ value: t.task, label: t.task }))} onSelect={(v) => handleReflectionChange("weakTask", v)} />
                    </div>
                    <label style={styles.followUpField}>
                      <p style={styles.followUpQuestion}>Anything else happened? (optional)</p>
                      <textarea value={learningReflection.otherIssue} onChange={(event) => handleReflectionChange("otherIssue", event.target.value)} placeholder="Example: Faculty jumped too fast, I got distracted, questions were from a different pattern..." rows={3} style={styles.followUpTextarea} />
                    </label>
                    <div style={styles.followUpActions}>
                      <button type="button" onClick={handleReflectionSubmit} disabled={!hasCompletedReflection || reflectionSubmitted} style={{ ...styles.followUpSubmitButton, ...(!hasCompletedReflection || reflectionSubmitted ? styles.followUpSubmitButtonDisabled : {}) }}>Analyze my difficulty</button>
                    </div>
                    {hasCompletedReflection && reflectionSubmitted ? (
                      <div style={styles.adaptiveCard}>
                        <p style={styles.adaptiveEyebrow}>ExamPilot Recommendation</p>
                        <h5 style={styles.adaptiveTitle}>{adaptiveGuidance.title}</h5>
                        <p style={styles.adaptiveBody}>{adaptiveGuidance.body}</p>
                        {learningReflection.otherIssue ? <p style={styles.adaptiveBody}>You also mentioned: {learningReflection.otherIssue}</p> : null}
                        <p style={styles.adaptiveAction}>{adaptiveGuidance.action}</p>
                        <button type="button" onClick={handleRegenerateWithWeakTopics} style={styles.followUpSubmitButton}>
                          Update my full plan with this
                        </button>
                        <p style={styles.followUpHint}>This rebuilds your plan for your remaining days, skipping what you've already completed.</p>
                      </div>
                    ) : (
                      <p style={styles.followUpHint}>Complete all 3 answers, then click "Analyze my difficulty" to unlock your next-step recommendation.</p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <div style={styles.progressCard}>
              <div style={styles.progressHeader}>
                <div>
                  <p style={styles.progressEyebrow}>Today&apos;s Progress</p>
                  <h3 style={styles.progressTitle}>{todayProgressLabel}</h3>
                  {backlogLabel ? <p style={styles.progressBacklogLabel}>{backlogLabel}</p> : null}
                </div>
                <strong style={styles.progressPercent}>{completedTodayTaskCount === 0 ? "Start" : `${todayProgressPercent}%`}</strong>
              </div>
              <div style={styles.progressTrack}><div style={{ ...styles.progressFill, width: `${todayProgressPercent}%` }} /></div>
              <p style={styles.progressMeta}>
                {pendingTodayTaskCount > 0 ? `${pendingTodayTaskCount} task${pendingTodayTaskCount === 1 ? "" : "s"} left for today.` : totalTodayTaskCount > 0 ? "Today's tasks are completed." : "Generate a plan to start today's progress."}
              </p>
            </div>

            {priorityRecoveryTasks.length > 0 ? (
              <div style={styles.recoveryCard}>
                <div style={styles.recoveryHeader}>
                  <div>
                    <p style={styles.recoveryEyebrow}>Recovery Mode</p>
                    <h3 style={styles.recoveryTitle}>Do these tasks first today</h3>
                  </div>
                  <span style={styles.recoveryCount}>{priorityRecoveryTasks.length} first priority</span>
                </div>
                <p style={styles.recoveryCopy}>
                  {isLowTimeMode ? `You only have ${result.daysLeft} day${result.daysLeft === 1 ? "" : "s"} left, so finish these high-priority pending tasks before starting anything new.` : "Start with these unfinished tasks first. After that, continue with the rest of your plan."}
                </p>
                <div style={styles.recoveryList}>
                  {priorityRecoveryTasks.map((task) => (
                    <div key={task.id} style={styles.recoveryTaskCard}>
                      <div style={styles.recoveryTaskMeta}>
                        <span style={styles.recoveryTaskDay}>{task.itemTitle}</span>
                        <span style={styles.recoveryTaskSection}>{task.sectionTitle}</span>
                      </div>
                      <p style={styles.recoveryTaskText}>{task.task}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {viewMode === "today" ? (
              todayPlan ? (
                <PlanCard item={todayPlan} highlight planKey={result.planKey} progressMap={progressMap} onToggleTask={handleToggleTask} />
              ) : (
                <p style={styles.emptyCopy}>Today&apos;s plan is not available yet.</p>
              )
            ) : (
              <>
                <div style={styles.previewHeader}>
                  <p style={styles.previewTitle}>Full Plan — Beta Unlocked</p>
                  <p style={styles.previewMeta}>All {result.fullPlan.length} days visible</p>
                </div>
                <div style={styles.planStack}>
                  {result.fullPlan.map((item) => (
                    <PlanCard key={item.id} item={item} planKey={result.planKey} progressMap={progressMap} onToggleTask={handleToggleTask} />
                  ))}
                </div>
              </>
            )}

            {pendingTasks.length > 0 ? (
              <div style={styles.upcomingSection}>
                <div style={styles.upcomingDivider}>
                  <span style={styles.upcomingDividerLine} />
                  <span style={styles.upcomingDividerLabel}>Upcoming days</span>
                  <span style={styles.upcomingDividerLine} />
                </div>
                <button type="button" onClick={() => setShowUpcomingDays((current) => !current)} style={styles.upcomingToggleButton}>
                  {showUpcomingDays ? "Hide full backlog" : "See full pending backlog"}
                  <span style={styles.upcomingToggleMeta}>{pendingTasks.length} pending across {pendingDayGroups.length} day{pendingDayGroups.length === 1 ? "" : "s"}</span>
                </button>
                {showUpcomingDays ? (
                  <div style={styles.pendingCard}>
                    <div style={styles.pendingHeader}>
                      <div>
                        <p style={styles.pendingEyebrow}>Pending Tasks</p>
                        <h3 style={styles.pendingTitle}>Full pending backlog</h3>
                      </div>
                      <span style={styles.pendingCount}>{pendingTasks.length} pending</span>
                    </div>
                    <div style={styles.pendingList}>
                      {pendingDayGroups.map((group) => (
                        <div key={group.dayTitle} style={styles.pendingItem}>
                          <div style={styles.pendingItemHeader}>
                            <p style={styles.pendingItemDay}>{group.dayTitle}</p>
                            <span style={styles.pendingItemCount}>{group.taskCount} tasks</span>
                          </div>
                          <div style={styles.pendingSectionList}>
                            {group.sections.map((section) => (
                              <div key={`${group.dayTitle}-${section.title}`} style={styles.pendingSection}>
                                <p style={styles.pendingItemSection}>{section.title}</p>
                                <ul style={styles.pendingTaskList}>
                                  {section.tasks.map((task) => (
                                    <li key={`${group.dayTitle}-${section.title}-${task}`} style={styles.pendingTaskBullet}>{task}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = {
  appShell: { minHeight: "100vh", position: "relative", background: "radial-gradient(circle at top, rgba(45, 212, 191, 0.18), transparent 28%), linear-gradient(180deg, #070b14 0%, #0b1220 55%, #070b14 100%)", color: "#f8fafc", fontFamily: "'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif", padding: "32px 16px 48px" },
  overlay: { position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(148, 163, 184, 0.04) 25%, transparent 25%), linear-gradient(225deg, rgba(148, 163, 184, 0.04) 25%, transparent 25%)", backgroundSize: "36px 36px", opacity: 0.4, pointerEvents: "none" },
  container: { position: "relative", zIndex: 1, width: "100%", maxWidth: "980px", margin: "0 auto", display: "grid", gap: "20px" },
  heroCard: { padding: "28px", borderRadius: "24px", background: "rgba(10, 15, 28, 0.88)", border: "1px solid rgba(255, 255, 255, 0.08)", boxShadow: "0 24px 80px rgba(0, 0, 0, 0.35)", backdropFilter: "blur(14px)" },
  brandPill: { display: "inline-flex", alignItems: "center", padding: "8px 14px", borderRadius: "999px", background: "rgba(45, 212, 191, 0.14)", color: "#99f6e4", fontSize: "12px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" },
  heroTitle: { margin: "18px 0 12px", fontSize: "clamp(2rem, 6vw, 3.5rem)", lineHeight: 1.05, letterSpacing: "-0.04em" },
  heroSubtitle: { margin: 0, maxWidth: "720px", color: "#cbd5e1", fontSize: "1rem", lineHeight: 1.7 },
  panel: { padding: "24px", borderRadius: "24px", background: "rgba(10, 15, 28, 0.88)", border: "1px solid rgba(255, 255, 255, 0.08)", boxShadow: "0 18px 60px rgba(0, 0, 0, 0.3)", backdropFilter: "blur(14px)" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  panelEyebrow: { margin: 0, color: "#94a3b8", fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase" },
  panelTitle: { margin: "8px 0 0", fontSize: "1.4rem", lineHeight: 1.2 },
  form: { display: "grid", gap: "18px" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" },
  label: { display: "grid", gap: "10px", color: "#e2e8f0", fontSize: "0.95rem", fontWeight: 600 },
  textarea: { width: "100%", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.1)", background: "rgba(15, 23, 42, 0.92)", color: "#f8fafc", padding: "16px", fontSize: "0.95rem", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" },
  input: { width: "100%", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.1)", background: "rgba(15, 23, 42, 0.92)", color: "#f8fafc", padding: "14px 16px", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" },
  select: { width: "100%", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.1)", background: "rgba(15, 23, 42, 0.92)", color: "#f8fafc", padding: "14px 16px", fontSize: "0.95rem", outline: "none", boxSizing: "border-box", appearance: "none" },
  buttonRow: { display: "flex", gap: "12px", flexWrap: "wrap" },
  primaryButton: { flex: "1 1 220px", border: "none", borderRadius: "16px", padding: "15px 18px", background: "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)", color: "#f8fafc", fontSize: "0.98rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 18px 40px rgba(15, 118, 110, 0.28)" },
  secondaryButton: { flex: "0 0 auto", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "16px", padding: "15px 18px", background: "rgba(15, 23, 42, 0.92)", color: "#f8fafc", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer" },
  helperText: { margin: 0, color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6 },
  usageText: { margin: 0, color: "#5eead4", fontSize: "0.9rem", lineHeight: 1.6 },
  adminText: { margin: 0, color: "#fde68a", fontSize: "0.88rem", lineHeight: 1.6 },
  resumeCard: { marginTop: "18px", padding: "18px", borderRadius: "18px", background: "rgba(15, 23, 42, 0.78)", border: "1px solid rgba(96, 165, 250, 0.16)", display: "grid", gap: "14px" },
  resumeEyebrow: { margin: 0, color: "#93c5fd", fontSize: "0.76rem", letterSpacing: "0.12em", textTransform: "uppercase" },
  resumeTitle: { margin: "8px 0 8px", fontSize: "1.08rem", lineHeight: 1.35 },
  resumeCopy: { margin: 0, color: "#cbd5e1", lineHeight: 1.65 },
  resumeActions: { display: "flex", gap: "12px", flexWrap: "wrap" },
  resumePrimaryButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "11px 16px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)", color: "#f8fafc", fontWeight: 700, cursor: "pointer" },
  resumeSecondaryButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "11px 16px", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.1)", background: "rgba(255, 255, 255, 0.03)", color: "#f8fafc", fontWeight: 700, cursor: "pointer" },
  errorBox: { marginTop: "16px", padding: "14px 16px", borderRadius: "16px", background: "rgba(127, 29, 29, 0.22)", border: "1px solid rgba(248, 113, 113, 0.35)", color: "#fecaca", fontSize: "0.92rem" },
  resultsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "20px" },
  toggleWrap: { display: "inline-flex", padding: "6px", borderRadius: "999px", background: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(255, 255, 255, 0.08)", gap: "6px" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "18px" },
  statCard: { padding: "14px 16px", borderRadius: "18px", background: "rgba(15, 23, 42, 0.75)", border: "1px solid rgba(255, 255, 255, 0.08)" },
  statLabel: { display: "block", color: "#94a3b8", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" },
  statValue: { fontSize: "1rem", lineHeight: 1.3 },
  toggleButton: { border: "none", borderRadius: "999px", padding: "10px 16px", background: "transparent", color: "#94a3b8", fontSize: "0.92rem", fontWeight: 700, cursor: "pointer" },
  toggleButtonActive: { background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "#f8fafc", boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.08)" },
  previewHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "16px" },
  previewTitle: { margin: 0, fontSize: "1rem", fontWeight: 700 },
  previewMeta: { margin: 0, color: "#94a3b8", fontSize: "0.92rem" },
  progressCard: { marginBottom: "18px", padding: "18px", borderRadius: "20px", background: "rgba(15, 23, 42, 0.78)", border: "1px solid rgba(94, 234, 212, 0.12)" },
  accountabilityCard: { marginBottom: "18px", padding: "20px", borderRadius: "20px", background: "linear-gradient(135deg, rgba(18, 28, 48, 0.92) 0%, rgba(11, 18, 32, 0.9) 100%)", border: "1px solid rgba(96, 165, 250, 0.18)" },
  accountabilityHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "16px" },
  accountabilityEyebrow: { margin: 0, color: "#93c5fd", fontSize: "0.76rem", letterSpacing: "0.12em", textTransform: "uppercase" },
  accountabilityTitle: { margin: "8px 0 0", fontSize: "1.2rem", lineHeight: 1.3 },
  streakBadge: { minWidth: "124px", padding: "12px 16px", borderRadius: "18px", background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(96, 165, 250, 0.16)", display: "grid", justifyItems: "center", gap: "2px" },
  streakValue: { fontSize: "1.7rem", fontWeight: 800, color: "#dbeafe", lineHeight: 1 },
  streakLabel: { color: "#93c5fd", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" },
  accountabilityGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "14px" },
  accountabilityMetric: { padding: "14px 16px", borderRadius: "16px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)", display: "grid", gap: "6px" },
  accountabilityMetricLabel: { color: "#94a3b8", fontSize: "0.84rem", textTransform: "uppercase", letterSpacing: "0.08em" },
  accountabilityMetricValue: { color: "#f8fafc", fontSize: "1.02rem", lineHeight: 1.4 },
  accountabilityCopy: { margin: "0 0 14px", color: "#cbd5e1", lineHeight: 1.65 },
  accountabilityButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "12px 18px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)", color: "#f8fafc", fontWeight: 700, cursor: "pointer" },
  accountabilityButtonDisabled: { opacity: 0.55, cursor: "not-allowed" },
  rewardsCard: { marginTop: "18px", padding: "18px", borderRadius: "18px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", display: "grid", gap: "14px" },
  rewardsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" },
  rewardsEyebrow: { margin: 0, color: "#fcd34d", fontSize: "0.76rem", letterSpacing: "0.12em", textTransform: "uppercase" },
  rewardsTitle: { margin: "8px 0 0", fontSize: "1.05rem", lineHeight: 1.4 },
  rewardsCount: { padding: "8px 12px", borderRadius: "999px", background: "rgba(250, 204, 21, 0.12)", color: "#fde68a", fontSize: "0.82rem", fontWeight: 700 },
  rewardsCopy: { margin: 0, color: "#cbd5e1", lineHeight: 1.65 },
  rewardProgressTrack: { width: "100%", height: "10px", borderRadius: "999px", background: "rgba(255, 255, 255, 0.08)", overflow: "hidden" },
  rewardProgressFill: { height: "100%", borderRadius: "999px", background: "linear-gradient(90deg, #f59e0b 0%, #facc15 100%)" },
  rewardMilestoneGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" },
  rewardMilestoneCard: { padding: "14px 16px", borderRadius: "16px", background: "rgba(15, 23, 42, 0.78)", border: "1px solid rgba(255, 255, 255, 0.06)", display: "grid", gap: "8px" },
  rewardMilestoneCardUnlocked: { border: "1px solid rgba(74, 222, 128, 0.28)", boxShadow: "0 16px 36px rgba(22, 163, 74, 0.12)" },
  rewardMilestoneTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" },
  rewardMilestoneDays: { color: "#f8fafc", fontWeight: 800, fontSize: "0.98rem" },
  rewardMilestoneStatus: { padding: "6px 10px", borderRadius: "999px", background: "rgba(148, 163, 184, 0.12)", color: "#cbd5e1", fontSize: "0.76rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" },
  rewardMilestoneStatusUnlocked: { background: "rgba(74, 222, 128, 0.12)", color: "#86efac" },
  rewardMilestoneTitle: { margin: 0, fontSize: "1rem", lineHeight: 1.35 },
  rewardMilestoneCopy: { margin: 0, color: "#94a3b8", lineHeight: 1.55, fontSize: "0.92rem" },
  confidenceCard: { marginTop: "18px", padding: "18px", borderRadius: "18px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", display: "grid", gap: "14px" },
  confidenceHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" },
  confidenceEyebrow: { margin: 0, color: "#c4b5fd", fontSize: "0.76rem", letterSpacing: "0.12em", textTransform: "uppercase" },
  confidenceTitle: { margin: "8px 0 0", fontSize: "1.02rem", lineHeight: 1.45 },
  confidenceStatus: { padding: "8px 12px", borderRadius: "999px", background: "rgba(196, 181, 253, 0.12)", color: "#ddd6fe", fontSize: "0.82rem", fontWeight: 700 },
  confidenceCopy: { margin: 0, color: "#cbd5e1", lineHeight: 1.65 },
  confidenceScale: { display: "flex", gap: "10px", flexWrap: "wrap" },
  confidenceButton: { width: "46px", height: "46px", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(15, 23, 42, 0.78)", color: "#f8fafc", fontWeight: 800, cursor: "pointer" },
  confidenceButtonActive: { background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)", border: "1px solid rgba(196, 181, 253, 0.5)" },
  confidenceButtonDisabled: { opacity: 0.45, cursor: "not-allowed" },
  confidenceLegend: { margin: 0, color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.5 },
  followUpCard: { marginTop: "14px", padding: "16px", borderRadius: "16px", background: "rgba(15, 23, 42, 0.78)", border: "1px solid rgba(196, 181, 253, 0.12)", display: "grid", gap: "14px" },
  followUpEyebrow: { margin: 0, color: "#c4b5fd", fontSize: "0.76rem", letterSpacing: "0.12em", textTransform: "uppercase" },
  followUpTitle: { margin: "6px 0 0", fontSize: "1rem", lineHeight: 1.45 },
  followUpGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" },
  followUpField: { display: "grid", gap: "10px", color: "#e2e8f0", fontSize: "0.92rem", fontWeight: 600 },
  followUpQuestion: { margin: 0, color: "#f8fafc", fontSize: "0.95rem", lineHeight: 1.5 },
  followUpChoices: { display: "grid", gap: "10px" },
  followUpChoiceButton: { width: "100%", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(255, 255, 255, 0.03)", color: "#f8fafc", padding: "14px 16px", fontSize: "0.95rem", lineHeight: 1.45, textAlign: "left", cursor: "pointer" },
  followUpChoiceButtonActive: { border: "1px solid rgba(45, 212, 191, 0.55)", background: "rgba(45, 212, 191, 0.14)", boxShadow: "0 0 0 1px rgba(45, 212, 191, 0.22) inset" },
  followUpTextarea: { width: "100%", minHeight: "86px", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(255, 255, 255, 0.03)", color: "#f8fafc", padding: "14px 16px", fontSize: "0.95rem", lineHeight: 1.55, resize: "vertical", outline: "none", boxSizing: "border-box" },
  followUpActions: { display: "flex", justifyContent: "flex-start" },
  followUpSubmitButton: { border: "none", borderRadius: "999px", background: "linear-gradient(135deg, #14b8a6, #22c55e)", color: "#04111a", padding: "12px 20px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer" },
  followUpSubmitButtonDisabled: { opacity: 0.45, cursor: "not-allowed" },
  followUpHint: { margin: 0, color: "#cbd5e1", lineHeight: 1.6 },
  adaptiveCard: { marginTop: "14px", padding: "16px", borderRadius: "16px", background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(74, 222, 128, 0.18)", display: "grid", gap: "8px" },
  adaptiveEyebrow: { margin: 0, color: "#86efac", fontSize: "0.76rem", letterSpacing: "0.12em", textTransform: "uppercase" },
  adaptiveTitle: { margin: 0, fontSize: "1rem", lineHeight: 1.4 },
  adaptiveBody: { margin: 0, color: "#d1fae5", lineHeight: 1.6 },
  adaptiveAction: { margin: 0, color: "#f8fafc", lineHeight: 1.6, fontWeight: 700 },
  progressHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" },
  progressEyebrow: { margin: 0, color: "#5eead4", fontSize: "0.76rem", letterSpacing: "0.12em", textTransform: "uppercase" },
  progressTitle: { margin: "8px 0 0", fontSize: "1.12rem", lineHeight: 1.3 },
  progressPercent: { fontSize: "1.5rem", color: "#99f6e4" },
  progressTrack: { width: "100%", height: "12px", borderRadius: "999px", background: "rgba(148, 163, 184, 0.14)", overflow: "hidden", marginTop: "14px" },
  progressFill: { height: "100%", borderRadius: "999px", background: "linear-gradient(135deg, #14b8a6 0%, #22c55e 100%)", transition: "width 180ms ease" },
  progressMeta: { margin: "12px 0 0", color: "#cbd5e1", lineHeight: 1.6 },
  progressBacklogLabel: { margin: "6px 0 0", color: "#64748b", fontSize: "0.85rem", lineHeight: 1.45 },
  checkInTag: { width: "fit-content", padding: "6px 10px", borderRadius: "999px", fontSize: "0.74rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" },
  checkInTagStrong: { background: "rgba(34, 197, 94, 0.12)", color: "#86efac" },
  checkInTagSolid: { background: "rgba(45, 212, 191, 0.12)", color: "#5eead4" },
  checkInTagShort: { background: "rgba(250, 204, 21, 0.12)", color: "#fde68a" },
  recoveryCard: { marginBottom: "18px", padding: "20px", borderRadius: "20px", background: "rgba(25, 35, 58, 0.82)", border: "1px solid rgba(250, 204, 21, 0.18)" },
  recoveryHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" },
  recoveryEyebrow: { margin: 0, color: "#fcd34d", fontSize: "0.76rem", letterSpacing: "0.12em", textTransform: "uppercase" },
  recoveryTitle: { margin: "8px 0 0", fontSize: "1.12rem", lineHeight: 1.3 },
  recoveryCount: { padding: "8px 12px", borderRadius: "999px", background: "rgba(250, 204, 21, 0.12)", color: "#fde68a", fontSize: "0.82rem", fontWeight: 700 },
  recoveryCopy: { margin: "12px 0 0", color: "#cbd5e1", lineHeight: 1.6 },
  recoveryList: { display: "grid", gap: "12px", marginTop: "16px" },
  recoveryTaskCard: { padding: "16px", borderRadius: "16px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)" },
  recoveryTaskMeta: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" },
  recoveryTaskDay: { margin: 0, color: "#f8fafc", fontWeight: 700 },
  recoveryTaskSection: { color: "#5eead4", fontSize: "0.84rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" },
  recoveryTaskText: { margin: "10px 0 0", color: "#e2e8f0", lineHeight: 1.5 },
  planStack: { display: "grid", gap: "16px" },
  planCard: { padding: "20px", borderRadius: "20px", background: "linear-gradient(180deg, rgba(15, 23, 42, 0.96) 0%, rgba(10, 15, 28, 0.96) 100%)", border: "1px solid rgba(255, 255, 255, 0.08)" },
  planCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "14px", flexWrap: "wrap" },
  planEyebrow: { margin: 0, color: "#5eead4", fontSize: "0.76rem", letterSpacing: "0.12em", textTransform: "uppercase" },
  planTitle: { margin: "8px 0 0", fontSize: "1.2rem", lineHeight: 1.25 },
  taskCount: { padding: "8px 12px", borderRadius: "999px", background: "rgba(148, 163, 184, 0.12)", color: "#cbd5e1", fontSize: "0.82rem", fontWeight: 700 },
  planSummary: { margin: "0 0 14px", color: "#cbd5e1", lineHeight: 1.6 },
  sectionStack: { display: "grid", gap: "12px" },
  sectionCard: { padding: "14px 16px", borderRadius: "16px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)" },
  sectionTitle: { margin: "0 0 10px", color: "#99f6e4", fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" },
  taskList: { margin: 0, paddingLeft: "18px", color: "#e2e8f0", display: "grid", gap: "10px" },
  taskLabel: { display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" },
  taskCheckbox: { width: "16px", height: "16px", marginTop: "4px", accentColor: "#14b8a6", flexShrink: 0 },
  taskItem: { lineHeight: 1.55 },
  taskItemDone: { color: "#94a3b8" },
  taskTextDone: { textDecoration: "line-through", opacity: 0.75 },
  emptyCopy: { margin: 0, color: "#94a3b8", lineHeight: 1.6 },
  upcomingSection: { marginTop: "18px", display: "grid", gap: "12px" },
  upcomingDivider: { display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "12px" },
  upcomingDividerLine: { height: "1px", background: "rgba(148, 163, 184, 0.2)" },
  upcomingDividerLabel: { color: "#94a3b8", fontSize: "0.76rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" },
  upcomingToggleButton: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "14px 16px", borderRadius: "16px", border: "1px solid rgba(148, 163, 184, 0.18)", background: "rgba(15, 23, 42, 0.72)", color: "#f8fafc", fontWeight: 800, cursor: "pointer", textAlign: "left" },
  upcomingToggleMeta: { color: "#94a3b8", fontSize: "0.84rem", fontWeight: 700, whiteSpace: "nowrap" },
  pendingCard: { marginTop: "14px", padding: "20px", borderRadius: "20px", background: "rgba(15, 23, 42, 0.78)", border: "1px solid rgba(255, 255, 255, 0.08)" },
  pendingHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "14px" },
  pendingEyebrow: { margin: 0, color: "#fcd34d", fontSize: "0.76rem", letterSpacing: "0.12em", textTransform: "uppercase" },
  pendingTitle: { margin: "8px 0 0", fontSize: "1.1rem" },
  pendingCount: { padding: "8px 12px", borderRadius: "999px", background: "rgba(250, 204, 21, 0.12)", color: "#fde68a", fontSize: "0.82rem", fontWeight: 700 },
  pendingList: { display: "grid", gap: "12px" },
  pendingItem: { padding: "14px 16px", borderRadius: "16px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)" },
  pendingItemHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" },
  pendingItemDay: { margin: 0, color: "#f8fafc", fontWeight: 700 },
  pendingItemCount: { color: "#94a3b8", fontSize: "0.84rem", fontWeight: 700 },
  pendingSectionList: { display: "grid", gap: "10px", marginTop: "12px" },
  pendingSection: { display: "grid", gap: "8px" },
  pendingItemSection: { margin: 0, color: "#5eead4", fontSize: "0.84rem", textTransform: "uppercase", letterSpacing: "0.06em" },
  pendingTaskList: { margin: 0, paddingLeft: "18px", display: "grid", gap: "8px" },
  pendingTaskBullet: { color: "#cbd5e1", lineHeight: 1.5 },
};