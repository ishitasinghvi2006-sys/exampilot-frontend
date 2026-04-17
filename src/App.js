import React, { useRef, useState } from "react";

const FREE_PREVIEW_DAYS = 2;
const UPI_ID = "yourname@upi";
const DEFAULT_BACKEND_BASE = "https://lectai-backend.onrender.com";

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

  candidates.push("/study-plan", "/api/study-plan");

  return [...new Set(candidates)];
}

function cleanLine(value) {
  return String(value || "")
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

function normalizeTextSection(section, index) {
  const lines = String(section || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return null;
  }

  const firstLine = lines[0];
  const taskLines = lines.slice(1).map(cleanLine).filter(Boolean);
  const looksLikeDayHeading = /^day\s*\d+/i.test(firstLine);
  const inlineSummary = looksLikeDayHeading
  ? firstLine.replace(/^day\s*\d+\s*[:-]?\s*/i, "").trim()
    : "";

  return {
    id: `plan-item-${index}`,
    title: looksLikeDayHeading ? firstLine : `Day ${index + 1}`,
    summary: taskLines.length ? "" : inlineSummary,
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

  return {
    id: `plan-item-${index}`,
    title,
    summary: tasks.length ? summary : "",
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
    const cleaned = rawPlan.trim();

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
        title: "Today's Plan",
      };
    }

    const tasks = toTaskList(rawTodayPlan);

    return {
      id: "today-plan",
      title: "Today's Plan",
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

function PlanCard({ item, highlight }) {
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
        {item.tasks.length > 0 ? (
          <span style={styles.taskCount}>{item.tasks.length} tasks</span>
        ) : null}
      </div>

      {item.summary ? <p style={styles.planSummary}>{item.summary}</p> : null}

      {item.tasks.length > 0 ? (
        <ul style={styles.taskList}>
          {item.tasks.map((task, index) => (
            <li key={`${item.id}-task-${index}`} style={styles.taskItem}>
              {task}
            </li>
          ))}
        </ul>
      ) : (
        <p style={styles.emptyCopy}>No tasks were returned for this section.</p>
      )}
    </div>
  );
}

export default function App() {
  const resultRef = useRef(null);
  const [formData, setFormData] = useState({
    examType: "JEE",
    syllabus: "",
    examDate: "",
    studyHours: "5",
  });
  const [viewMode, setViewMode] = useState("today");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState({
    fullPlan: [],
    todayPlan: null,
    daysLeft: null,
  });

  const previewPlan = result.fullPlan.slice(0, FREE_PREVIEW_DAYS);
  const hiddenDayCount = Math.max(result.fullPlan.length - FREE_PREVIEW_DAYS, 0);
  const hasPlan = result.fullPlan.length > 0 || Boolean(result.todayPlan);
  const todayPlan = result.todayPlan || result.fullPlan[0] || null;

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

      setResult({
        fullPlan,
        todayPlan: todayPlanData,
        daysLeft: typeof data.daysLeft === "number" ? data.daysLeft : null,
      });
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
    setResult({
      fullPlan: [],
      todayPlan: null,
      daysLeft: null,
    });
    setViewMode("today");
    setError("");
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
              <p style={styles.panelEyebrow}>Phase 1 MVP</p>
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
          </form>

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
                <strong style={styles.statValue}>{formData.examType}</strong>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Study Hours</span>
                <strong style={styles.statValue}>{formData.studyHours}/day</strong>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Days Left</span>
                <strong style={styles.statValue}>
                  {result.daysLeft !== null ? result.daysLeft : "Calculated in plan"}
                </strong>
              </div>
            </div>

            {viewMode === "today" ? (
              todayPlan ? (
                <PlanCard item={todayPlan} highlight />
              ) : (
                <p style={styles.emptyCopy}>Today&apos;s plan is not available yet.</p>
              )
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
                    <PlanCard key={item.id} item={item} />
                  ))}
                </div>

                {hiddenDayCount > 0 ? (
                  <div style={styles.paywallCard}>
                    <div style={styles.lockBadge}>Locked Preview</div>
                    <h3 style={styles.paywallTitle}>Unlock full plan for Rs 49</h3>
                    <p style={styles.paywallCopy}>
                      You can preview the first {FREE_PREVIEW_DAYS} days free. The
                      remaining {hiddenDayCount} day
                      {hiddenDayCount > 1 ? "s are" : " is"} locked for this MVP
                      monetization test.
                    </p>
                    <div style={styles.paywallDetails}>
                      <p style={styles.paywallLine}>UPI: {UPI_ID}</p>
                      <p style={styles.paywallLine}>
                        Send screenshot on WhatsApp to unlock
                      </p>
                    </div>
                  </div>
                ) : null}
              </>
            )}
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
  taskList: {
    margin: 0,
    paddingLeft: "18px",
    color: "#e2e8f0",
    display: "grid",
    gap: "10px",
  },
  taskItem: {
    lineHeight: 1.55,
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
  paywallDetails: {
    marginTop: "18px",
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
};