import React, { useState } from "react";

const API = "https://lectai-backend.onrender.com";

export default function App() {
  const [syllabus, setSyllabus] = useState("");
  const [examDate, setExamDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState(null);
  const [todayPlan, setTodayPlan] = useState(null);
  const [view, setView] = useState("today");

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/study-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syllabus, examDate, hoursPerDay }),
      });

      const data = await res.json();

      setPlan(data.plan);
      setTodayPlan(data.todayPlan);
    } catch (err) {
      setError("Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "60px auto", color: "white" }}>
      <h1>ExamPilot 🚀</h1>

      {!plan && (
        <>
          <textarea
            placeholder="Paste syllabus"
            value={syllabus}
            onChange={(e) => setSyllabus(e.target.value)}
          />

          <input type="date" onChange={(e) => setExamDate(e.target.value)} />

          <input
            type="number"
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(e.target.value)}
          />

          <button onClick={handleGenerate}>
            {loading ? "Generating..." : "Generate"}
          </button>

          {error && <p>{error}</p>}
        </>
      )}

      {plan && (
        <>
          <div>
            <button onClick={() => setView("today")}>Today</button>
            <button onClick={() => setView("full")}>Full Plan</button>
          </div>

          <pre style={{ whiteSpace: "pre-wrap" }}>
            {view === "today" ? todayPlan : plan}
          </pre>

          <button onClick={() => setPlan(null)}>Reset</button>
        </>
      )}
    </div>
  );
}