import React, { useState, useRef } from "react";

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

  const resultRef = useRef(null);

  const handleGenerate = async () => {
    if (!syllabus.trim()) return setError("Paste your syllabus");
    if (!examDate) return setError("Select exam date");

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

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);

    } catch {
      setError("Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        body {
          margin: 0;
          font-family: Inter, sans-serif;
          background: radial-gradient(circle at top, #0f0f1a, #050509);
          color: #fff;
        }

        .container {
          max-width: 750px;
          margin: 80px auto;
          padding: 20px;
        }

        .title {
          font-size: 42px;
          font-weight: 700;
        }

        .subtitle {
          color: #888;
          margin-bottom: 30px;
        }

        .card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 25px;
          border-radius: 16px;
        }

        textarea, input {
          width: 100%;
          padding: 12px;
          margin-bottom: 12px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(0,0,0,0.4);
          color: white;
        }

        button {
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #7c6aff, #5b4bff);
          color: white;
          font-weight: 600;
          cursor: pointer;
        }

        .toggle {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .toggle button {
          flex: 1;
          background: rgba(255,255,255,0.1);
        }

        .active {
          background: #7c6aff !important;
        }

        .result {
          margin-top: 20px;
          white-space: pre-wrap;
          line-height: 1.6;
          background: rgba(255,255,255,0.05);
          padding: 20px;
          border-radius: 12px;
        }

        .error {
          color: #ff6b6b;
          margin-top: 10px;
        }
      `}</style>

      <div className="container">
        <div className="title">ExamPilot 🚀</div>
        <div className="subtitle">
          Turn your syllabus into a personalized exam plan
        </div>

        {!plan && (
          <div className="card">
            <textarea
              placeholder="Paste syllabus..."
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
              {loading ? "Generating..." : "Generate Study Plan"}
            </button>

            {error && <div className="error">{error}</div>}
          </div>
        )}

        {plan && (
          <div ref={resultRef}>
            <div className="toggle">
              <button
                className={view === "today" ? "active" : ""}
                onClick={() => setView("today")}
              >
                🔥 Today Plan
              </button>
              <button
                className={view === "full" ? "active" : ""}
                onClick={() => setView("full")}
              >
                📚 Full Plan
              </button>
            </div>

            <div className="result">
              {view === "today" ? todayPlan : plan}
            </div>

            <button style={{ marginTop: 15 }} onClick={() => setPlan(null)}>
              ← New Plan
            </button>
          </div>
        )}
      </div>
    </>
  );
}