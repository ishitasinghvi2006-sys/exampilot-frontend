import React, { useState, useRef } from "react";

const API = "https://lectai-backend.onrender.com";

export default function App() {
  const [syllabus, setSyllabus] = useState("");
  const [examDate, setExamDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState(null);

  const resultRef = useRef(null);

  const handleGenerate = async () => {
    if (!syllabus.trim()) return setError("Paste your syllabus");
    if (!examDate) return setError("Select exam date");

    setLoading(true);
    setError(null);
    setPlan(null);

    try {
      const res = await fetch(`${API}/study-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syllabus, examDate, hoursPerDay }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed");
      }

      setPlan(data.plan);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);

    } catch (err) {
      setError(err.message);
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
          margin-bottom: 10px;
        }

        .subtitle {
          color: #888;
          margin-bottom: 40px;
        }

        .card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 30px;
          border-radius: 16px;
          backdrop-filter: blur(10px);
        }

        textarea, input {
          width: 100%;
          padding: 14px;
          margin-bottom: 15px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(0,0,0,0.4);
          color: white;
          font-size: 14px;
        }

        textarea {
          min-height: 140px;
        }

        button {
          width: 100%;
          padding: 16px;
          border-radius: 12px;
          border: none;
          font-weight: 600;
          font-size: 15px;
          background: linear-gradient(135deg, #7c6aff, #5b4bff);
          color: white;
          cursor: pointer;
          transition: 0.2s;
        }

        button:hover {
          transform: translateY(-1px);
        }

        button:disabled {
          opacity: 0.6;
        }

        .error {
          margin-top: 10px;
          color: #ff6b6b;
        }

        .result {
          margin-top: 40px;
          padding: 25px;
          border-radius: 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          white-space: pre-wrap;
          line-height: 1.7;
          font-size: 14px;
        }

        .new-btn {
          margin-top: 20px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
        }
      `}</style>

      <div className="container">
        <div className="title">ExamPilot 🚀</div>
        <div className="subtitle">
          Turn your syllabus into a personalized exam plan in seconds
        </div>

        {!plan && (
          <div className="card">
            <textarea
              placeholder="Paste your syllabus here..."
              value={syllabus}
              onChange={(e) => setSyllabus(e.target.value)}
            />

            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />

            <input
              type="number"
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(Number(e.target.value))}
            />

            <button onClick={handleGenerate} disabled={loading}>
              {loading ? "⏳ Generating (~30s first time)" : "Generate Study Plan"}
            </button>

            {error && <div className="error">{error}</div>}
          </div>
        )}

        {plan && (
          <div ref={resultRef}>
            <div className="result">{plan}</div>

            <button className="new-btn" onClick={() => setPlan(null)}>
              ← Create New Plan
            </button>
          </div>
        )}
      </div>
    </>
  );
}