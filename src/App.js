import React, { useEffect, useRef, useState } from "react";

const FREE_PREVIEW_DAYS = 2;
const FREE_FULL_PLAN_LIMIT = 3;
const PLAN_USAGE_STORAGE_KEY = "exampilot-full-plan-usage-count";
const PLAN_SESSION_STORAGE_KEY = "exampilot-current-plan-session";
const PLAN_PROGRESS_STORAGE_PREFIX = "exampilot-plan-progress";
const DAILY_CHECKIN_STORAGE_KEY = "exampilot-daily-checkin";
const PLAN_CONFIDENCE_STORAGE_PREFIX = "exampilot-plan-confidence";
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

const SECTION_HEADING_PATTERN =
  /^(Morning(?:\s*\([^)]*\))?|Evening(?:\s*\([^)]*\))?|Must Finish Today|Practice|Revision Check|Key Points|Practice Questions|Memory Tricks|Focus|Why This Day Matters)\s*:?\s*(.*)$/i;

function buildWhatsAppLink() {
  const message = encodeURIComponent(
    `Hi ExamPilot, I paid Rs ${PAYMENT_AMOUNT} to unlock my full study plan. Sharing my payment screenshot here.`
  );

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
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

function hashString(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

function getStoredPlanUsageCount() {
  if (typeof window === "undefined") {
    return 0;
  }

  const rawValue = window.localStorage.getItem(PLAN_USAGE_STORAGE_KEY);
  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
}

function storePlanUsageCount(count) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PLAN_USAGE_STORAGE_KEY, String(count));
}

function getProgressStorageKey(planKey) {
  return `${PLAN_PROGRESS_STORAGE_PREFIX}:${planKey}`;
}

function loadStoredPlanSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(PLAN_SESSION_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);

    if (!parsedValue || typeof parsedValue !== "object") {
      return null;
    }

    return parsedValue;
  } catch (error) {
    return null;
  }
}

function storePlanSession(session) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PLAN_SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearStoredPlanSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(PLAN_SESSION_STORAGE_KEY);
}

function loadStoredProgress(planKey) {
  if (typeof window === "undefined" || !planKey) {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(getProgressStorageKey(planKey));

    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue);
    return parsedValue && typeof parsedValue === "object" ? parsedValue : {};
  } catch (error) {
    return {};
  }
}

function storeProgress(planKey, progressMap) {
  if (typeof window === "undefined" || !planKey) {
    return;
  }

  window.localStorage.setItem(
    getProgressStorageKey(planKey),
    JSON.stringify(progressMap)
  );
}

function getConfidenceStorageKey(planKey) {
  return `${PLAN_CONFIDENCE_STORAGE_PREFIX}:${planKey}`;
}

function loadStoredConfidence(planKey) {
  if (typeof window === "undefined" || !planKey) {
    return 0;
  }

  const rawValue = window.localStorage.getItem(getConfidenceStorageKey(planKey));
  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) && parsedValue >= 1 && parsedValue <= 5
    ? parsedValue
    : 0;
}

function storeConfidence(planKey, confidence) {
  if (typeof window === "undefined" || !planKey) {
    return;
  }

  if (!confidence) {
    window.localStorage.removeItem(getConfidenceStorageKey(planKey));
    return;
  }

  window.localStorage.setItem(getConfidenceStorageKey(planKey), String(confidence));
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
    return {
      streakCount: 0,
      lastCheckInDate: "",
    };
  }

  try {
    const rawValue = window.localStorage.getItem(DAILY_CHECKIN_STORAGE_KEY);

    if (!rawValue) {
      return {
        streakCount: 0,
        lastCheckInDate: "",
      };
    }

    const parsedValue = JSON.parse(rawValue);

    return {
      streakCount:
        Number.isFinite(Number(parsedValue?.streakCount)) && Number(parsedValue?.streakCount) > 0
          ? Number(parsedValue.streakCount)
          : 0,
      lastCheckInDate: String(parsedValue?.lastCheckInDate || ""),
    };
  } catch (error) {
    return {
      streakCount: 0,
      lastCheckInDate: "",
    };
  }
}

function storeDailyCheckIn(value) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DAILY_CHECKIN_STORAGE_KEY, JSON.stringify(value));
}

function buildPlanKey({ examType, examDate, studyHours, fullPlan }) {
  return hashString(
    JSON.stringify({
      examType,
      examDate,
      studyHours,
      fullPlan,
    })
  );
}

function getFounderMode() {
  if (typeof window === "undefined") {
    return false;
  }

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

    if (!normalized) {
      return;
    }

    if (/\/study-plan\/?$/i.test(normalized)) {
      candidates.push(normalized);
      return;
    }

    candidates.push(`${normalized.replace(/\/$/, "")}/study-plan`);
  });

  return [...new Set(candidates)];
}

function cleanLine(value) {
  return String(value || "")
    .replace(/\*\*/g, "")
    .replace(/^[-*\u2022\d.)\s]+/, "")
    .trim();
}

function uniqueLines(items) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function toTaskList(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return uniqueLines(
      value.flatMap((entry) => {
        if (!entry) {
          return [];
        }

        if (typeof entry === "string") {
          const cleaned = cleanLine(entry);
          return cleaned ? [cleaned] : [];
        }

        if (typeof entry === "object") {
          return [
            ...toTaskList(entry.task),
            ...toTaskList(entry.title),
            ...toTaskList(entry.topic),
            ...toTaskList(entry.label),
            ...toTaskList(entry.description),
            ...toTaskList(entry.text),
          ];
        }

        return [];
      })
    );
  }

  if (typeof value === "string") {
    return uniqueLines(
      value
        .split(/\n+/)
        .map(cleanLine)
        .filter(Boolean)
    );
  }

  return [];
}

function formatDayTitle(value, index) {
  const cleaned = String(value || "").trim();

  if (!cleaned) {
    return `Day ${index + 1}`;
  }

  if (/^day\s*\d+/i.test(cleaned)) {
    return cleaned;
  }

  return `Day ${index + 1}: ${cleaned}`;
}

function countPlanTasks(item) {
  if (!item) {
    return 0;
  }

  const sectionTasks = Array.isArray(item.sections)
    ? item.sections.reduce((total, section) => total + section.tasks.length, 0)
    : 0;

  return sectionTasks || item.tasks.length;
}

function getTaskOwnerTitle(item) {
  return item.storageTitle || item.title || "Study Day";
}

function getRenderableSections(item) {
  if (Array.isArray(item.sections) && item.sections.length > 0) {
    return item.sections;
  }

  if (Array.isArray(item.tasks) && item.tasks.length > 0) {
    return [
      {
        title: "Tasks",
        tasks: item.tasks,
      },
    ];
  }

  return [];
}

function buildTaskId(planKey, itemTitle, sectionTitle, task) {
  return hashString([planKey, itemTitle, sectionTitle, task].join("::"));
}

function collectPlanTasks(planItems, planKey) {
  if (!planKey || !Array.isArray(planItems)) {
    return [];
  }

  return planItems.flatMap((item) => {
    const itemTitle = getTaskOwnerTitle(item);

    return getRenderableSections(item).flatMap((section) =>
      section.tasks.map((task) => ({
        id: buildTaskId(planKey, itemTitle, section.title, task),
        itemTitle,
        sectionTitle: section.title,
        task,
      }))
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
    const existingDay = dayMap.get(task.itemTitle) || {
      dayTitle: task.itemTitle,
      daySortValue: extractDaySortValue(task.itemTitle),
      sections: new Map(),
      tasks: [],
    };

    const existingSection = existingDay.sections.get(task.sectionTitle) || [];
    existingSection.push(task.task);
    existingDay.sections.set(task.sectionTitle, uniqueLines(existingSection));
    existingDay.tasks.push(task);
    dayMap.set(task.itemTitle, existingDay);
  });

  return [...dayMap.values()]
    .sort((a, b) => a.daySortValue - b.daySortValue)
    .map((day) => ({
      dayTitle: day.dayTitle,
      taskCount: day.tasks.length,
      sections: [...day.sections.entries()].map(([title, tasks]) => ({
        title,
        tasks,
      })),
    }));
}

function buildSectionsFromLines(lines) {
  const sections = [];
  let currentSection = null;

  lines.forEach((line) => {
    const cleaned = cleanLine(line);

    if (!cleaned) {
      return;
    }

    const sectionMatch = cleaned.match(SECTION_HEADING_PATTERN);

    if (sectionMatch) {
      currentSection = {
        title: sectionMatch[1].trim(),
        tasks: sectionMatch[2] ? [sectionMatch[2].trim()] : [],
      };
      sections.push(currentSection);
      return;
    }

    if (currentSection) {
      currentSection.tasks.push(cleaned);
    }
  });

  return sections
    .map((section) => ({
      ...section,
      tasks: uniqueLines(section.tasks.map(cleanLine).filter(Boolean)),
    }))
    .filter((section) => section.tasks.length > 0);
}

function normalizeTextSection(section, index) {
  const lines = String(section || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return null;
  }

  const firstLine = cleanLine(lines[0]);
  const taskLines = lines.slice(1).map(cleanLine).filter(Boolean);
  const looksLikeDayHeading = /^day\s*\d+/i.test(firstLine);
  const inlineSummary = looksLikeDayHeading
    ? firstLine.replace(/^day\s*\d+\s*[:-]?\s*/i, "").trim()
    : "";
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
  if (!item) {
    return null;
  }

  if (typeof item === "string") {
    return normalizeTextSection(item, index);
  }

  if (typeof item !== "object") {
    return null;
  }

  const title = formatDayTitle(
    item.title || item.day || item.heading || item.label || item.name,
    index
  );

  const tasks = uniqueLines([
    ...toTaskList(item.tasks),
    ...toTaskList(item.topics),
    ...toTaskList(item.items),
    ...toTaskList(item.plan),
    ...toTaskList(item.content),
    ...toTaskList(item.subtopics),
  ]);

  const summary =
    String(
      item.summary ||
        item.description ||
        item.note ||
        item.focus ||
        item.overview ||
        ""
    ).trim() || "";
  const sections = [
    ...buildSectionsFromLines(toTaskList(item.tasks)),
    ...buildSectionsFromLines(toTaskList(item.plan)),
    ...buildSectionsFromLines(toTaskList(item.content)),
  ];

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
  if (!rawPlan) {
    return [];
  }

  if (Array.isArray(rawPlan)) {
    return rawPlan.map(normalizePlanItem).filter(Boolean);
  }

  if (typeof rawPlan === "string") {
    const cleaned = rawPlan.trim().replace(/\*\*/g, "");

    if (!cleaned) {
      return [];
    }

    const matchedDays = cleaned.match(
      /(?:^|\n)(Day\s*\d+[^\n]*[\s\S]*?)(?=\nDay\s*\d+\b|$)/gi
    );

    const sections = matchedDays && matchedDays.length
      ? matchedDays.map((entry) => entry.trim())
      : cleaned.split(/\n\s*\n+/).map((entry) => entry.trim()).filter(Boolean);

    return sections.map(normalizePlanItem).filter(Boolean);
  }

  if (typeof rawPlan === "object") {
    if (rawPlan.days || rawPlan.schedule || rawPlan.items) {
      return normalizePlan(rawPlan.days || rawPlan.schedule || rawPlan.items);
    }

    if (rawPlan.plan || rawPlan.studyPlan || rawPlan.fullPlan || rawPlan.full_plan) {
      return normalizePlan(
        rawPlan.plan || rawPlan.studyPlan || rawPlan.fullPlan || rawPlan.full_plan
      );
    }

    return Object.values(rawPlan).map(normalizePlanItem).filter(Boolean);
  }

  return [];
}

function normalizeTodayPlan(rawTodayPlan, fallbackFullPlan) {
  if (!rawTodayPlan) {
    return fallbackFullPlan[0] || null;
  }

  if (Array.isArray(rawTodayPlan)) {
    return normalizePlan(rawTodayPlan)[0] || fallbackFullPlan[0] || null;
  }

  if (typeof rawTodayPlan === "string") {
    const parsed = normalizePlan(rawTodayPlan);

    if (parsed[0]) {
      return {
        ...parsed[0],
        storageTitle: parsed[0].storageTitle || parsed[0].title,
        title: "Today's Plan",
      };
    }

    const tasks = toTaskList(rawTodayPlan);

    return {
      id: "today-plan",
      title: "Today's Plan",
      storageTitle: fallbackFullPlan[0]?.storageTitle || "Day 1",
      summary: "",
      tasks,
    };
  }

  if (typeof rawTodayPlan === "object") {
    const parsed = normalizePlanItem(rawTodayPlan, 0);

    if (!parsed) {
      return fallbackFullPlan[0] || null;
    }

    return {
      ...parsed,
      storageTitle: parsed.storageTitle || parsed.title,
      title: "Today's Plan",
    };
  }

  return fallbackFullPlan[0] || null;
}

async function requestPlan(payload) {
  const endpoints = buildApiCandidates();
  let lastError = new Error("Unable to connect to ExamPilot right now.");

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        lastError = new Error(
          data.error ||
            data.message ||
            `Plan generation failed with status ${response.status}.`
        );
        continue;
      }

      return data;
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error("Something went wrong while generating the plan.");
    }
  }

  throw lastError;
}

function PlanCard({ item, highlight, planKey, progressMap, onToggleTask }) {
  const taskCount = countPlanTasks(item);
  const itemTitle = getTaskOwnerTitle(item);
  const renderSections = getRenderableSections(item);

  return (
    <div
      style={{
        ...styles.planCard,
        borderColor: highlight ? "rgba(94, 234, 212, 0.35)" : "rgba(255, 255, 255, 0.08)",
        boxShadow: highlight
          ? "0 18px 50px rgba(15, 118, 110, 0.25)"
          : "0 14px 40px rgba(0, 0, 0, 0.28)",
      }}
    >
      <div style={styles.planCardHeader}>
        <div>
          <p style={styles.planEyebrow}>{highlight ? "Free Today View" : "Study Day"}</p>
          <h3 style={styles.planTitle}>{item.title}</h3>
        </div>
        {taskCount > 0 ? (
          <span style={styles.taskCount}>{taskCount} tasks</span>
        ) : null}
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
                    <li
                      key={`${item.id}-${section.title}-${index}`}
                      style={{
                        ...styles.taskItem,
                        ...(checked ? styles.taskItemDone : {}),
                      }}
                    >
                      <label style={styles.taskLabel}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleTask(taskId)}
                          style={styles.taskCheckbox}
                        />
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
              <li
                key={`${item.id}-task-${index}`}
                style={{
                  ...styles.taskItem,
                  ...(checked ? styles.taskItemDone : {}),
                }}
              >
                <label style={styles.taskLabel}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleTask(taskId)}
                    style={styles.taskCheckbox}
                  />
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

export default function App() {
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
  const [resumeSession, setResumeSession] = useState(savedSession);
  const [result, setResult] = useState(EMPTY_RESULT);
  const [progressMap, setProgressMap] = useState(loadStoredProgress(""));

  const previewPlan = result.fullPlan.slice(0, FREE_PREVIEW_DAYS);
  const hiddenDayCount = Math.max(result.fullPlan.length - FREE_PREVIEW_DAYS, 0);
  const hasPlan = result.fullPlan.length > 0 || Boolean(result.todayPlan);
  const hasResumeSession = Boolean(resumeSession?.result?.planKey) && !hasPlan;
  const todayPlan = result.todayPlan || result.fullPlan[0] || null;
  const resultMeta = result.meta || null;
  const freeFullPlansLeft = Math.max(FREE_FULL_PLAN_LIMIT - planUsageCount, 0);
  const hasFullPlanAccess =
    founderMode || (planUsageCount > 0 && planUsageCount <= FREE_FULL_PLAN_LIMIT);
  const trackablePlanItems = hasFullPlanAccess ? result.fullPlan : previewPlan;
  const allPlanTasks = collectPlanTasks(trackablePlanItems, result.planKey);
  const completedTaskCount = allPlanTasks.filter((task) => progressMap[task.id]).length;
  const totalTaskCount = allPlanTasks.length;
  const progressPercent = totalTaskCount
    ? Math.round((completedTaskCount / totalTaskCount) * 100)
    : 0;
  const pendingTasks = allPlanTasks.filter((task) => !progressMap[task.id]);
  const pendingDayGroups = buildPendingDayGroups(pendingTasks);
  const recoveryTaskLimit = Math.max(
    2,
    Math.min(5, Number(resultMeta?.studyHours || formData.studyHours) || 3)
  );
  const priorityRecoveryTasks = pendingTasks.slice(0, recoveryTaskLimit);
  const isLowTimeMode = typeof result.daysLeft === "number" && result.daysLeft <= 3;
  const todayPlanTasks = todayPlan ? collectPlanTasks([todayPlan], result.planKey) : [];
  const completedTodayTaskCount = todayPlanTasks.filter((task) => progressMap[task.id]).length;
  const totalTodayTaskCount = todayPlanTasks.length;
  const pendingTodayTaskCount = Math.max(totalTodayTaskCount - completedTodayTaskCount, 0);
  const todayDateKey = getISTDateKey();
  const yesterdayDateKey = getYesterdayISTDateKey();
  const hasCheckedInToday = dailyCheckIn.lastCheckInDate === todayDateKey;
  const streakCount =
    dailyCheckIn.lastCheckInDate === todayDateKey ||
    dailyCheckIn.lastCheckInDate === yesterdayDateKey
      ? dailyCheckIn.streakCount
      : 0;
  const unlockedRewardCount = STREAK_REWARD_MILESTONES.filter(
    (milestone) => streakCount >= milestone.days
  ).length;
  const nextRewardMilestone =
    STREAK_REWARD_MILESTONES.find((milestone) => streakCount < milestone.days) || null;
  const rewardProgressPercent = nextRewardMilestone
    ? Math.min(100, Math.round((streakCount / nextRewardMilestone.days) * 100))
    : 100;
  const confidenceLabel =
    todayConfidence <= 0
      ? "Not rated yet"
      : todayConfidence <= 2
      ? "Needs revision"
      : todayConfidence === 3
      ? "Moderate understanding"
      : "Strong understanding";
  const confidenceCopy =
    todayConfidence <= 0
      ? "After finishing today's tasks, rate your confidence so ExamPilot can start understanding what feels weak or strong."
      : todayConfidence <= 2
      ? "Low confidence signal detected. Revisit today's key topics and practice again before moving ahead."
      : todayConfidence === 3
      ? "You are partly confident. One more revision or practice round should strengthen this topic."
      : "Strong confidence signal detected. You can move ahead, and later ExamPilot can reduce extra revision on strong topics.";
  const canMarkTodayDone =
    totalTodayTaskCount > 0 &&
    completedTodayTaskCount === totalTodayTaskCount &&
    !hasCheckedInToday;

  useEffect(() => {
    setProgressMap(loadStoredProgress(result.planKey));
  }, [result.planKey]);

  useEffect(() => {
    setTodayConfidence(loadStoredConfidence(result.planKey));
  }, [result.planKey]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const syllabus = formData.syllabus.trim();
      const studyHours = Number(formData.studyHours);

      if (!syllabus || !formData.examDate || !studyHours) {
        throw new Error("Please fill in syllabus, exam date, and study hours.");
      }

      const payload = {
        examType: formData.examType,
        syllabus,
        examDate: formData.examDate,
        studyHours,
        hoursPerDay: studyHours,
        studyHoursPerDay: studyHours,
      };

      const data = await requestPlan(payload);
      const rawFullPlan =
        data.fullPlan ||
        data.full_plan ||
        data.plan ||
        data.studyPlan ||
        data.study_plan ||
        data.result ||
        data.output ||
        "";

      const fullPlan = normalizePlan(rawFullPlan);
      const todayPlanData = normalizeTodayPlan(
        data.todayPlan || data.today_plan || data.today || data.todayStudyPlan,
        fullPlan
      );

      if (!fullPlan.length && !todayPlanData) {
        throw new Error("Plan generated, but the response format was empty.");
      }

      const nextUsageCount = planUsageCount + 1;
      const normalizedFormData = {
        ...formData,
        syllabus,
        studyHours: String(studyHours),
      };
      const planKey = buildPlanKey({
        examType: normalizedFormData.examType,
        examDate: normalizedFormData.examDate,
        studyHours: normalizedFormData.studyHours,
        fullPlan,
      });
      const nextResult = {
        fullPlan,
        todayPlan: todayPlanData,
        daysLeft: typeof data.daysLeft === "number" ? data.daysLeft : null,
        planKey,
        meta: {
          examType: normalizedFormData.examType,
          examDate: normalizedFormData.examDate,
          studyHours: normalizedFormData.studyHours,
        },
      };

      setPlanUsageCount(nextUsageCount);
      storePlanUsageCount(nextUsageCount);
      setFormData(normalizedFormData);
      setResult(nextResult);
      const nextSession = {
        result: nextResult,
      };
      setResumeSession(nextSession);
      storePlanSession(nextSession);
      setViewMode("today");

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to generate the study plan right now."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleReset() {
    setResult(EMPTY_RESULT);
    setFormData(DEFAULT_FORM_DATA);
    setProgressMap({});
    setResumeSession(null);
    clearStoredPlanSession();
    setViewMode("today");
    setError("");
  }

  function handleResumeLastPlan() {
    if (!resumeSession?.result) {
      return;
    }

    setResult(resumeSession.result);
    setProgressMap(loadStoredProgress(resumeSession.result.planKey));
    setViewMode("today");

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  function handleStartFresh() {
    setResumeSession(null);
    clearStoredPlanSession();
    setResult(EMPTY_RESULT);
    setFormData(DEFAULT_FORM_DATA);
    setProgressMap({});
    setViewMode("today");
    setError("");
  }

  function handleToggleTask(taskId) {
    setProgressMap((current) => {
      const next = {
        ...current,
        [taskId]: !current[taskId],
      };

      storeProgress(result.planKey, next);
      return next;
    });
  }

  function handleDailyCheckIn() {
    if (!canMarkTodayDone) {
      return;
    }

    const nextValue = {
      streakCount:
        dailyCheckIn.lastCheckInDate === yesterdayDateKey ? dailyCheckIn.streakCount + 1 : 1,
      lastCheckInDate: todayDateKey,
    };

    setDailyCheckIn(nextValue);
    storeDailyCheckIn(nextValue);
  }

  function handleConfidenceSelect(score) {
    if (completedTodayTaskCount !== totalTodayTaskCount || !result.planKey) {
      return;
    }

    setTodayConfidence(score);
    storeConfidence(result.planKey, score);
  }

  return (
    <div style={styles.appShell}>
      <div style={styles.overlay} />

      <main style={styles.container}>
        <section style={styles.heroCard}>
          <div style={styles.brandPill}>ExamPilot</div>
          <h1 style={styles.heroTitle}>Know exactly what to study today.</h1>
          <p style={styles.heroSubtitle}>
            Turn a stressful syllabus into a daily action plan built around your exam
            date and available study hours.
          </p>
        </section>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Generate your personalized study plan</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGrid}>
              <label style={styles.label}>
                Exam Type
                <select
                  name="examType"
                  value={formData.examType}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="JEE">JEE</option>
                  <option value="NEET">NEET</option>
                  <option value="UPSC">UPSC</option>
                  <option value="College Exams">College Exams</option>
                </select>
              </label>

              <label style={styles.label}>
                Exam Date
                <input
                  type="date"
                  name="examDate"
                  value={formData.examDate}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </label>

              <label style={styles.label}>
                Study Hours / Day
                <input
                  type="number"
                  name="studyHours"
                  value={formData.studyHours}
                  onChange={handleChange}
                  placeholder="e.g. 3"
                  min="1"
                  max="16"
                  style={styles.input}
                  required
                />
              </label>
            </div>

            <label style={styles.label}>
              Syllabus
              <textarea
                name="syllabus"
                value={formData.syllabus}
                onChange={handleChange}
                placeholder="Paste your syllabus, units, or exam topics here..."
                style={styles.textarea}
                rows={9}
                required
              />
            </label>

            <div style={styles.buttonRow}>
              <button type="submit" disabled={loading} style={styles.primaryButton}>
                {loading ? "Generating..." : "Generate Study Plan"}
              </button>
              {hasPlan ? (
                <button type="button" onClick={handleReset} style={styles.secondaryButton}>
                  New Plan
                </button>
              ) : null}
            </div>

            <p style={styles.helperText}>
              ExamPilot shows Today Plan first so students can start fast without
              feeling overwhelmed.
            </p>
            <p style={styles.usageText}>
              First {FREE_FULL_PLAN_LIMIT} full plans are free. After that, only the
              first {FREE_PREVIEW_DAYS} days stay visible until payment.
            </p>
            {founderMode ? (
              <p style={styles.adminText}>
                Founder mode is enabled in this browser. Full plans stay unlocked for
                manual delivery after payment.
              </p>
            ) : null}
          </form>

          {hasResumeSession ? (
            <div style={styles.resumeCard}>
              <div>
                <p style={styles.resumeEyebrow}>Saved Browser Session</p>
                <h3 style={styles.resumeTitle}>A previous study plan is available</h3>
                <p style={styles.resumeCopy}>
                  This browser has an older saved plan. Students will now see a clean
                  form first. Resume the older plan only if you want to continue your
                  own earlier work.
                </p>
              </div>
              <div style={styles.resumeActions}>
                <button
                  type="button"
                  onClick={handleResumeLastPlan}
                  style={styles.resumePrimaryButton}
                >
                  Resume last plan
                </button>
                <button
                  type="button"
                  onClick={handleStartFresh}
                  style={styles.resumeSecondaryButton}
                >
                  Start fresh
                </button>
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
                <button
                  type="button"
                  onClick={() => setViewMode("today")}
                  style={{
                    ...styles.toggleButton,
                    ...(viewMode === "today" ? styles.toggleButtonActive : {}),
                  }}
                >
                  Today Plan
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("full")}
                  style={{
                    ...styles.toggleButton,
                    ...(viewMode === "full" ? styles.toggleButtonActive : {}),
                  }}
                >
                  Full Plan
                </button>
              </div>
            </div>

            <div style={styles.statsRow}>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Exam Type</span>
                <strong style={styles.statValue}>
                  {resultMeta?.examType || formData.examType}
                </strong>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Study Hours</span>
                <strong style={styles.statValue}>
                  {resultMeta?.studyHours || formData.studyHours}/day
                </strong>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Days Left</span>
                <strong style={styles.statValue}>
                  {result.daysLeft !== null ? result.daysLeft : "Calculated in plan"}
                </strong>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Free Full Plans Left</span>
                <strong style={styles.statValue}>{freeFullPlansLeft}</strong>
              </div>
            </div>

            <div style={styles.accountabilityCard}>
              <div style={styles.accountabilityHeader}>
                <div>
                  <p style={styles.accountabilityEyebrow}>Daily Accountability</p>
                  <h3 style={styles.accountabilityTitle}>
                    Build the habit, not just the plan
                  </h3>
                </div>
                <div style={styles.streakBadge}>
                  <span style={styles.streakValue}>{streakCount}</span>
                  <span style={styles.streakLabel}>day streak</span>
                </div>
              </div>

              <div style={styles.accountabilityGrid}>
                <div style={styles.accountabilityMetric}>
                  <span style={styles.accountabilityMetricLabel}>Today&apos;s Plan</span>
                  <strong style={styles.accountabilityMetricValue}>
                    {completedTodayTaskCount} / {totalTodayTaskCount} tasks done
                  </strong>
                </div>
                <div style={styles.accountabilityMetric}>
                  <span style={styles.accountabilityMetricLabel}>Check-in Status</span>
                  <strong style={styles.accountabilityMetricValue}>
                    {hasCheckedInToday ? "Checked in today" : "Pending today"}
                  </strong>
                </div>
              </div>

              <p style={styles.accountabilityCopy}>
                {hasCheckedInToday
                  ? "You already marked today done. Come back tomorrow and keep the streak alive."
                  : canMarkTodayDone
                  ? "Today's tasks are complete. Mark the day done now to keep your streak going."
                  : `Finish ${pendingTodayTaskCount} more ${
                      pendingTodayTaskCount === 1 ? "task" : "tasks"
                    } from Today's Plan before marking the day done.`}
              </p>

              <button
                type="button"
                onClick={handleDailyCheckIn}
                disabled={!canMarkTodayDone}
                style={{
                  ...styles.accountabilityButton,
                  ...(!canMarkTodayDone ? styles.accountabilityButtonDisabled : {}),
                }}
              >
                {hasCheckedInToday
                  ? "Checked in today"
                  : canMarkTodayDone
                  ? "Mark today done"
                  : "Finish today's tasks first"}
              </button>

              <div style={styles.rewardsCard}>
                <div style={styles.rewardsHeader}>
                  <div>
                    <p style={styles.rewardsEyebrow}>Streak Rewards</p>
                    <h4 style={styles.rewardsTitle}>
                      {nextRewardMilestone
                        ? `${nextRewardMilestone.days - streakCount} more day${
                            nextRewardMilestone.days - streakCount === 1 ? "" : "s"
                          } to your next reward`
                        : "All current streak rewards unlocked"}
                    </h4>
                  </div>
                  <span style={styles.rewardsCount}>
                    {unlockedRewardCount}/{STREAK_REWARD_MILESTONES.length} unlocked
                  </span>
                </div>

                <p style={styles.rewardsCopy}>
                  {nextRewardMilestone
                    ? `Stay consistent and keep checking in daily. Your next unlock is the ${nextRewardMilestone.days}-day ${nextRewardMilestone.title}.`
                    : "You unlocked every current reward. Next we can add stronger milestone perks and streak bonuses."}
                </p>

                <div style={styles.rewardProgressTrack}>
                  <div
                    style={{
                      ...styles.rewardProgressFill,
                      width: `${rewardProgressPercent}%`,
                    }}
                  />
                </div>

                <div style={styles.rewardMilestoneGrid}>
                  {STREAK_REWARD_MILESTONES.map((milestone) => {
                    const unlocked = streakCount >= milestone.days;

                    return (
                      <div
                        key={milestone.days}
                        style={{
                          ...styles.rewardMilestoneCard,
                          ...(unlocked ? styles.rewardMilestoneCardUnlocked : {}),
                        }}
                      >
                        <div style={styles.rewardMilestoneTop}>
                          <span style={styles.rewardMilestoneDays}>{milestone.days} days</span>
                          <span
                            style={{
                              ...styles.rewardMilestoneStatus,
                              ...(unlocked ? styles.rewardMilestoneStatusUnlocked : {}),
                            }}
                          >
                            {unlocked ? "Unlocked" : "Locked"}
                          </span>
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
                    <h4 style={styles.confidenceTitle}>
                      Rate how confident you feel after today&apos;s work
                    </h4>
                  </div>
                  <span style={styles.confidenceStatus}>{confidenceLabel}</span>
                </div>

                <p style={styles.confidenceCopy}>{confidenceCopy}</p>

                <div style={styles.confidenceScale}>
                  {[1, 2, 3, 4, 5].map((score) => {
                    const active = todayConfidence === score;
                    const disabled = completedTodayTaskCount !== totalTodayTaskCount;

                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() => handleConfidenceSelect(score)}
                        disabled={disabled}
                        style={{
                          ...styles.confidenceButton,
                          ...(active ? styles.confidenceButtonActive : {}),
                          ...(disabled ? styles.confidenceButtonDisabled : {}),
                        }}
                      >
                        {score}
                      </button>
                    );
                  })}
                </div>

                <p style={styles.confidenceLegend}>
                  1 = very weak, 3 = average, 5 = very strong
                </p>
              </div>
            </div>

            <div style={styles.progressCard}>
              <div style={styles.progressHeader}>
                <div>
                  <p style={styles.progressEyebrow}>Daily Execution</p>
                  <h3 style={styles.progressTitle}>
                    {completedTaskCount} / {totalTaskCount} tasks completed
                  </h3>
                </div>
                <strong style={styles.progressPercent}>{progressPercent}%</strong>
              </div>
              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${progressPercent}%`,
                  }}
                />
              </div>
              <p style={styles.progressMeta}>
                {pendingTasks.length > 0
                  ? `${pendingTasks.length} tasks are still pending.`
                  : "All tasks are completed for this plan."}
              </p>
            </div>

            {priorityRecoveryTasks.length > 0 ? (
              <div style={styles.recoveryCard}>
                <div style={styles.recoveryHeader}>
                  <div>
                    <p style={styles.recoveryEyebrow}>Recovery Mode</p>
                    <h3 style={styles.recoveryTitle}>
                      Do these tasks first today
                    </h3>
                  </div>
                  <span style={styles.recoveryCount}>
                    {priorityRecoveryTasks.length} first priority
                  </span>
                </div>
                <p style={styles.recoveryCopy}>
                  {isLowTimeMode
                    ? `You only have ${result.daysLeft} day${
                        result.daysLeft === 1 ? "" : "s"
                      } left, so finish these high-priority pending tasks before starting anything new.`
                    : "Start with these unfinished tasks first. After that, continue with the rest of your plan."}
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
                <PlanCard
                  item={todayPlan}
                  highlight
                  planKey={result.planKey}
                  progressMap={progressMap}
                  onToggleTask={handleToggleTask}
                />
              ) : (
                <p style={styles.emptyCopy}>Today&apos;s plan is not available yet.</p>
              )
            ) : (
              <>
                {hasFullPlanAccess ? (
                  <>
                    <div style={styles.previewHeader}>
                      <p style={styles.previewTitle}>Full Plan Unlocked</p>
                      <p style={styles.previewMeta}>
                        {founderMode
                          ? "Founder mode enabled"
                          : `Free unlock ${Math.min(
                              planUsageCount,
                              FREE_FULL_PLAN_LIMIT
                            )} of ${FREE_FULL_PLAN_LIMIT}`}
                      </p>
                    </div>

                    <div style={styles.planStack}>
                      {result.fullPlan.map((item) => (
                        <PlanCard
                          key={item.id}
                          item={item}
                          planKey={result.planKey}
                          progressMap={progressMap}
                          onToggleTask={handleToggleTask}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={styles.previewHeader}>
                      <p style={styles.previewTitle}>Free Preview</p>
                      <p style={styles.previewMeta}>
                        Showing the first {Math.min(FREE_PREVIEW_DAYS, result.fullPlan.length)}{" "}
                        of {result.fullPlan.length || 0} days
                      </p>
                    </div>

                    <div style={styles.planStack}>
                      {previewPlan.map((item) => (
                        <PlanCard
                          key={item.id}
                          item={item}
                          planKey={result.planKey}
                          progressMap={progressMap}
                          onToggleTask={handleToggleTask}
                        />
                      ))}
                    </div>

                    {hiddenDayCount > 0 ? (
                      <div style={styles.paywallCard}>
                        <div style={styles.lockBadge}>Payment Required</div>
                        <h3 style={styles.paywallTitle}>Unlock full plan for Rs {PAYMENT_AMOUNT}</h3>
                        <p style={styles.paywallCopy}>
                          Your first {FREE_FULL_PLAN_LIMIT} full plans were free. From the
                          4th plan onward, only the first {FREE_PREVIEW_DAYS} days stay
                          visible. The remaining {hiddenDayCount} day
                          {hiddenDayCount > 1 ? "s are" : " is"} locked for this plan.
                        </p>
                        <div style={styles.paywallGrid}>
                          <div style={styles.qrCard}>
                            <img
                              src={buildQrImageUrl()}
                              alt="ExamPilot payment QR"
                              style={styles.qrImage}
                            />
                            <a href={buildUpiPaymentLink()} style={styles.payButton}>
                              Pay with UPI App
                            </a>
                          </div>
                          <div style={styles.paywallDetails}>
                            <p style={styles.paywallLine}>UPI: {UPI_ID}</p>
                            <p style={styles.paywallLine}>Amount: Rs {PAYMENT_AMOUNT}</p>
                            <p style={styles.paywallLine}>
                              Scan the QR or pay via UPI, then send the screenshot on WhatsApp.
                            </p>
                            <a
                              href={buildWhatsAppLink()}
                              target="_blank"
                              rel="noreferrer"
                              style={styles.whatsAppButton}
                            >
                              Open WhatsApp
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </>
            )}

            {pendingTasks.length > 0 ? (
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
                                <li
                                  key={`${group.dayTitle}-${section.title}-${task}`}
                                  style={styles.pendingTaskBullet}
                                >
                                  {task}
                                </li>
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
          </section>
        ) : null}
      </main>
    </div>
  );
}

const styles = {
  appShell: {
    minHeight: "100vh",
    position: "relative",
    background:
      "radial-gradient(circle at top, rgba(45, 212, 191, 0.18), transparent 28%), linear-gradient(180deg, #070b14 0%, #0b1220 55%, #070b14 100%)",
    color: "#f8fafc",
    fontFamily:
      "'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    padding: "32px 16px 48px",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(135deg, rgba(148, 163, 184, 0.04) 25%, transparent 25%), linear-gradient(225deg, rgba(148, 163, 184, 0.04) 25%, transparent 25%)",
    backgroundSize: "36px 36px",
    opacity: 0.4,
    pointerEvents: "none",
  },
  container: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: "980px",
    margin: "0 auto",
    display: "grid",
    gap: "20px",
  },
  heroCard: {
    padding: "28px",
    borderRadius: "24px",
    background: "rgba(10, 15, 28, 0.88)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 24px 80px rgba(0, 0, 0, 0.35)",
    backdropFilter: "blur(14px)",
  },
  brandPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "rgba(45, 212, 191, 0.14)",
    color: "#99f6e4",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  heroTitle: {
    margin: "18px 0 12px",
    fontSize: "clamp(2rem, 6vw, 3.5rem)",
    lineHeight: 1.05,
    letterSpacing: "-0.04em",
  },
  heroSubtitle: {
    margin: 0,
    maxWidth: "720px",
    color: "#cbd5e1",
    fontSize: "1rem",
    lineHeight: 1.7,
  },
  panel: {
    padding: "24px",
    borderRadius: "24px",
    background: "rgba(10, 15, 28, 0.88)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 18px 60px rgba(0, 0, 0, 0.3)",
    backdropFilter: "blur(14px)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  panelEyebrow: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "0.78rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  panelTitle: {
    margin: "8px 0 0",
    fontSize: "1.4rem",
    lineHeight: 1.2,
  },
  form: {
    display: "grid",
    gap: "18px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
  },
  label: {
    display: "grid",
    gap: "10px",
    color: "#e2e8f0",
    fontSize: "0.95rem",
    fontWeight: 600,
  },
  textarea: {
    width: "100%",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(15, 23, 42, 0.92)",
    color: "#f8fafc",
    padding: "16px",
    fontSize: "0.95rem",
    lineHeight: 1.6,
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
  },
  input: {
    width: "100%",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(15, 23, 42, 0.92)",
    color: "#f8fafc",
    padding: "14px 16px",
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(15, 23, 42, 0.92)",
    color: "#f8fafc",
    padding: "14px 16px",
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box",
    appearance: "none",
  },
  buttonRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  primaryButton: {
    flex: "1 1 220px",
    border: "none",
    borderRadius: "16px",
    padding: "15px 18px",
    background: "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)",
    color: "#f8fafc",
    fontSize: "0.98rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 18px 40px rgba(15, 118, 110, 0.28)",
  },
  secondaryButton: {
    flex: "0 0 auto",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "16px",
    padding: "15px 18px",
    background: "rgba(15, 23, 42, 0.92)",
    color: "#f8fafc",
    fontSize: "0.95rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  helperText: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "0.9rem",
    lineHeight: 1.6,
  },
  usageText: {
    margin: 0,
    color: "#5eead4",
    fontSize: "0.9rem",
    lineHeight: 1.6,
  },
  adminText: {
    margin: 0,
    color: "#fde68a",
    fontSize: "0.88rem",
    lineHeight: 1.6,
  },
  resumeCard: {
    marginTop: "18px",
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(15, 23, 42, 0.78)",
    border: "1px solid rgba(96, 165, 250, 0.16)",
    display: "grid",
    gap: "14px",
  },
  resumeEyebrow: {
    margin: 0,
    color: "#93c5fd",
    fontSize: "0.76rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  resumeTitle: {
    margin: "8px 0 8px",
    fontSize: "1.08rem",
    lineHeight: 1.35,
  },
  resumeCopy: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.65,
  },
  resumeActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  resumePrimaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "11px 16px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
    color: "#f8fafc",
    fontWeight: 700,
    cursor: "pointer",
  },
  resumeSecondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "11px 16px",
    borderRadius: "14px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(255, 255, 255, 0.03)",
    color: "#f8fafc",
    fontWeight: 700,
    cursor: "pointer",
  },
  errorBox: {
    marginTop: "16px",
    padding: "14px 16px",
    borderRadius: "16px",
    background: "rgba(127, 29, 29, 0.22)",
    border: "1px solid rgba(248, 113, 113, 0.35)",
    color: "#fecaca",
    fontSize: "0.92rem",
  },
  resultsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },
  toggleWrap: {
    display: "inline-flex",
    padding: "6px",
    borderRadius: "999px",
    background: "rgba(15, 23, 42, 0.95)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    gap: "6px",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    marginBottom: "18px",
  },
  statCard: {
    padding: "14px 16px",
    borderRadius: "18px",
    background: "rgba(15, 23, 42, 0.75)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  statLabel: {
    display: "block",
    color: "#94a3b8",
    fontSize: "0.78rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "8px",
  },
  statValue: {
    fontSize: "1rem",
    lineHeight: 1.3,
  },
  toggleButton: {
    border: "none",
    borderRadius: "999px",
    padding: "10px 16px",
    background: "transparent",
    color: "#94a3b8",
    fontSize: "0.92rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  toggleButtonActive: {
    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    color: "#f8fafc",
    boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.08)",
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  previewTitle: {
    margin: 0,
    fontSize: "1rem",
    fontWeight: 700,
  },
  previewMeta: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "0.92rem",
  },
  progressCard: {
    marginBottom: "18px",
    padding: "18px",
    borderRadius: "20px",
    background: "rgba(15, 23, 42, 0.78)",
    border: "1px solid rgba(94, 234, 212, 0.12)",
  },
  accountabilityCard: {
    marginBottom: "18px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(18, 28, 48, 0.92) 0%, rgba(11, 18, 32, 0.9) 100%)",
    border: "1px solid rgba(96, 165, 250, 0.18)",
  },
  accountabilityHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  accountabilityEyebrow: {
    margin: 0,
    color: "#93c5fd",
    fontSize: "0.76rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  accountabilityTitle: {
    margin: "8px 0 0",
    fontSize: "1.2rem",
    lineHeight: 1.3,
  },
  streakBadge: {
    minWidth: "124px",
    padding: "12px 16px",
    borderRadius: "18px",
    background: "rgba(59, 130, 246, 0.12)",
    border: "1px solid rgba(96, 165, 250, 0.16)",
    display: "grid",
    justifyItems: "center",
    gap: "2px",
  },
  streakValue: {
    fontSize: "1.7rem",
    fontWeight: 800,
    color: "#dbeafe",
    lineHeight: 1,
  },
  streakLabel: {
    color: "#93c5fd",
    fontSize: "0.8rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  accountabilityGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginBottom: "14px",
  },
  accountabilityMetric: {
    padding: "14px 16px",
    borderRadius: "16px",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    display: "grid",
    gap: "6px",
  },
  accountabilityMetricLabel: {
    color: "#94a3b8",
    fontSize: "0.84rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  accountabilityMetricValue: {
    color: "#f8fafc",
    fontSize: "1.02rem",
    lineHeight: 1.4,
  },
  accountabilityCopy: {
    margin: "0 0 14px",
    color: "#cbd5e1",
    lineHeight: 1.65,
  },
  accountabilityButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 18px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
    color: "#f8fafc",
    fontWeight: 700,
    cursor: "pointer",
  },
  accountabilityButtonDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
  rewardsCard: {
    marginTop: "18px",
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    display: "grid",
    gap: "14px",
  },
  rewardsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  rewardsEyebrow: {
    margin: 0,
    color: "#fcd34d",
    fontSize: "0.76rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  rewardsTitle: {
    margin: "8px 0 0",
    fontSize: "1.05rem",
    lineHeight: 1.4,
  },
  rewardsCount: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(250, 204, 21, 0.12)",
    color: "#fde68a",
    fontSize: "0.82rem",
    fontWeight: 700,
  },
  rewardsCopy: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.65,
  },
  rewardProgressTrack: {
    width: "100%",
    height: "10px",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  rewardProgressFill: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #f59e0b 0%, #facc15 100%)",
  },
  rewardMilestoneGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },
  rewardMilestoneCard: {
    padding: "14px 16px",
    borderRadius: "16px",
    background: "rgba(15, 23, 42, 0.78)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    display: "grid",
    gap: "8px",
  },
  rewardMilestoneCardUnlocked: {
    border: "1px solid rgba(74, 222, 128, 0.28)",
    boxShadow: "0 16px 36px rgba(22, 163, 74, 0.12)",
  },
  rewardMilestoneTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  rewardMilestoneDays: {
    color: "#f8fafc",
    fontWeight: 800,
    fontSize: "0.98rem",
  },
  rewardMilestoneStatus: {
    padding: "6px 10px",
    borderRadius: "999px",
    background: "rgba(148, 163, 184, 0.12)",
    color: "#cbd5e1",
    fontSize: "0.76rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  rewardMilestoneStatusUnlocked: {
    background: "rgba(74, 222, 128, 0.12)",
    color: "#86efac",
  },
  rewardMilestoneTitle: {
    margin: 0,
    fontSize: "1rem",
    lineHeight: 1.35,
  },
  rewardMilestoneCopy: {
    margin: 0,
    color: "#94a3b8",
    lineHeight: 1.55,
    fontSize: "0.92rem",
  },
  confidenceCard: {
    marginTop: "18px",
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    display: "grid",
    gap: "14px",
  },
  confidenceHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  confidenceEyebrow: {
    margin: 0,
    color: "#c4b5fd",
    fontSize: "0.76rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  confidenceTitle: {
    margin: "8px 0 0",
    fontSize: "1.02rem",
    lineHeight: 1.45,
  },
  confidenceStatus: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(196, 181, 253, 0.12)",
    color: "#ddd6fe",
    fontSize: "0.82rem",
    fontWeight: 700,
  },
  confidenceCopy: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.65,
  },
  confidenceScale: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  confidenceButton: {
    width: "46px",
    height: "46px",
    borderRadius: "14px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    background: "rgba(15, 23, 42, 0.78)",
    color: "#f8fafc",
    fontWeight: 800,
    cursor: "pointer",
  },
  confidenceButtonActive: {
    background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
    border: "1px solid rgba(196, 181, 253, 0.5)",
  },
  confidenceButtonDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  confidenceLegend: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "0.88rem",
    lineHeight: 1.5,
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  progressEyebrow: {
    margin: 0,
    color: "#5eead4",
    fontSize: "0.76rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  progressTitle: {
    margin: "8px 0 0",
    fontSize: "1.12rem",
    lineHeight: 1.3,
  },
  progressPercent: {
    fontSize: "1.5rem",
    color: "#99f6e4",
  },
  progressTrack: {
    width: "100%",
    height: "12px",
    borderRadius: "999px",
    background: "rgba(148, 163, 184, 0.14)",
    overflow: "hidden",
    marginTop: "14px",
  },
  progressFill: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #14b8a6 0%, #22c55e 100%)",
    transition: "width 180ms ease",
  },
  progressMeta: {
    margin: "12px 0 0",
    color: "#cbd5e1",
    lineHeight: 1.6,
  },
  recoveryCard: {
    marginBottom: "18px",
    padding: "20px",
    borderRadius: "20px",
    background: "rgba(25, 35, 58, 0.82)",
    border: "1px solid rgba(250, 204, 21, 0.18)",
  },
  recoveryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  recoveryEyebrow: {
    margin: 0,
    color: "#fcd34d",
    fontSize: "0.76rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  recoveryTitle: {
    margin: "8px 0 0",
    fontSize: "1.12rem",
    lineHeight: 1.3,
  },
  recoveryCount: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(250, 204, 21, 0.12)",
    color: "#fde68a",
    fontSize: "0.82rem",
    fontWeight: 700,
  },
  recoveryCopy: {
    margin: "12px 0 0",
    color: "#cbd5e1",
    lineHeight: 1.6,
  },
  recoveryList: {
    display: "grid",
    gap: "12px",
    marginTop: "16px",
  },
  recoveryTaskCard: {
    padding: "16px",
    borderRadius: "16px",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
  recoveryTaskMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  recoveryTaskDay: {
    margin: 0,
    color: "#f8fafc",
    fontWeight: 700,
  },
  recoveryTaskSection: {
    color: "#5eead4",
    fontSize: "0.84rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  recoveryTaskText: {
    margin: "10px 0 0",
    color: "#e2e8f0",
    lineHeight: 1.5,
  },
  planStack: {
    display: "grid",
    gap: "16px",
  },
  planCard: {
    padding: "20px",
    borderRadius: "20px",
    background: "linear-gradient(180deg, rgba(15, 23, 42, 0.96) 0%, rgba(10, 15, 28, 0.96) 100%)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  planCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "14px",
    flexWrap: "wrap",
  },
  planEyebrow: {
    margin: 0,
    color: "#5eead4",
    fontSize: "0.76rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  planTitle: {
    margin: "8px 0 0",
    fontSize: "1.2rem",
    lineHeight: 1.25,
  },
  taskCount: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(148, 163, 184, 0.12)",
    color: "#cbd5e1",
    fontSize: "0.82rem",
    fontWeight: 700,
  },
  planSummary: {
    margin: "0 0 14px",
    color: "#cbd5e1",
    lineHeight: 1.6,
  },
  sectionStack: {
    display: "grid",
    gap: "12px",
  },
  sectionCard: {
    padding: "14px 16px",
    borderRadius: "16px",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
  sectionTitle: {
    margin: "0 0 10px",
    color: "#99f6e4",
    fontSize: "0.9rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  taskList: {
    margin: 0,
    paddingLeft: "18px",
    color: "#e2e8f0",
    display: "grid",
    gap: "10px",
  },
  taskLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    cursor: "pointer",
  },
  taskCheckbox: {
    width: "16px",
    height: "16px",
    marginTop: "4px",
    accentColor: "#14b8a6",
    flexShrink: 0,
  },
  taskItem: {
    lineHeight: 1.55,
  },
  taskItemDone: {
    color: "#94a3b8",
  },
  taskTextDone: {
    textDecoration: "line-through",
    opacity: 0.75,
  },
  emptyCopy: {
    margin: 0,
    color: "#94a3b8",
    lineHeight: 1.6,
  },
  paywallCard: {
    marginTop: "18px",
    padding: "24px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(22, 28, 45, 0.98) 0%, rgba(10, 15, 28, 0.98) 100%)",
    border: "1px solid rgba(250, 204, 21, 0.24)",
    boxShadow: "0 24px 70px rgba(0, 0, 0, 0.35)",
  },
  lockBadge: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(250, 204, 21, 0.12)",
    color: "#fde68a",
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  paywallTitle: {
    margin: "16px 0 10px",
    fontSize: "1.5rem",
    lineHeight: 1.2,
  },
  paywallCopy: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.7,
  },
  paywallGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
    alignItems: "start",
    marginTop: "18px",
  },
  qrCard: {
    padding: "16px",
    borderRadius: "18px",
    background: "rgba(15, 23, 42, 0.8)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    display: "grid",
    gap: "12px",
    justifyItems: "center",
  },
  qrImage: {
    width: "100%",
    maxWidth: "208px",
    borderRadius: "16px",
    background: "#ffffff",
    padding: "10px",
    boxSizing: "border-box",
  },
  payButton: {
    width: "100%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 16px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)",
    color: "#f8fafc",
    textDecoration: "none",
    fontWeight: 700,
  },
  paywallDetails: {
    padding: "16px",
    borderRadius: "18px",
    background: "rgba(15, 23, 42, 0.75)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  paywallLine: {
    margin: "6px 0",
    color: "#f8fafc",
    fontWeight: 600,
    lineHeight: 1.6,
  },
  whatsAppButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "12px",
    padding: "12px 16px",
    borderRadius: "14px",
    background: "#16a34a",
    color: "#f8fafc",
    fontWeight: 700,
    textDecoration: "none",
  },
  pendingCard: {
    marginTop: "18px",
    padding: "20px",
    borderRadius: "20px",
    background: "rgba(15, 23, 42, 0.78)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  pendingHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "14px",
  },
  pendingEyebrow: {
    margin: 0,
    color: "#fcd34d",
    fontSize: "0.76rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  pendingTitle: {
    margin: "8px 0 0",
    fontSize: "1.1rem",
  },
  pendingCount: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(250, 204, 21, 0.12)",
    color: "#fde68a",
    fontSize: "0.82rem",
    fontWeight: 700,
  },
  pendingList: {
    display: "grid",
    gap: "12px",
  },
  pendingItem: {
    padding: "14px 16px",
    borderRadius: "16px",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
  pendingItemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  pendingItemDay: {
    margin: 0,
    color: "#f8fafc",
    fontWeight: 700,
  },
  pendingItemCount: {
    color: "#94a3b8",
    fontSize: "0.84rem",
    fontWeight: 700,
  },
  pendingSectionList: {
    display: "grid",
    gap: "10px",
    marginTop: "12px",
  },
  pendingSection: {
    display: "grid",
    gap: "8px",
  },
  pendingItemSection: {
    margin: 0,
    color: "#5eead4",
    fontSize: "0.84rem",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  pendingTaskList: {
    margin: 0,
    paddingLeft: "18px",
    display: "grid",
    gap: "8px",
  },
  pendingTaskBullet: {
    color: "#cbd5e1",
    lineHeight: 1.5,
  },
};