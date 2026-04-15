import React, { useState } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5001";   // ← Change to your backend URL later

export default function App() {
  const [syllabus, setSyllabus] = useState("");
  const [examDate, setExamDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState(4);
  const [university, setUniversity] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);        // Will store the full plan

  const handleGenerate = async () => {
    if (!syllabus.trim() || !examDate) {
      setError("Syllabus and Exam Date are required");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API}/study-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syllabus,
          examDate,
          hoursPerDay,
          university: university || "Indian University",
          subject: subject || "",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate plan");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetApp = () => {
    setSyllabus("");
    setExamDate("");
    setResult(null);
    setError(null);
  };

  return (
    <>
      <style>{`
        :root {
          --bg:#080810; --bg2:#0e0e1a; --bg3:#13131f;
          --accent:#7c6aff; --accent2:#a78bff;
          --text:#f0f0fa; --text2:#9090b0; --border:rgba(255,255,255,0.07);
          --radius:16px;
        }
        body { background: var(--bg); color: var(--text); font-family: system-ui, sans-serif; margin: 0; padding: 0; }
        .header { display: flex; justify-content: space-between; align-items: center; padding: 20px 40px; border-bottom: 1px solid var(--border); }
        .logo { font-size: 28px; font-weight: 800; }
        .logo span { color: var(--accent); }
        .hero { text-align: center; padding: 80px 20px 60px; }
        .form-container { max-width: 700px; margin: 0 auto; background: var(--bg2); border-radius: var(--radius); padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .input-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; color: var(--text2); font-size: 14px; }
        textarea, input { width: 100%; padding: 14px; background: var(--bg3); border: 1px solid var(--border); border-radius: 12px; color: white; font-size: 16px; }
        textarea { min-height: 160px; resize: vertical; }
        .row { display: flex; gap: 20px; }
        .row > div { flex: 1; }
        .generate-btn { width: 100%; padding: 18px; background: var(--accent); color: white; border: none; border-radius: 12px; font-size: 18px; font-weight: 600; cursor: pointer; margin-top: 10px; }
        .generate-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .result { background: var(--bg3); border-radius: var(--radius); padding: 30px; margin-top: 30px; white-space: pre-wrap; line-height: 1.6; }
        .error { color: #ff6b6b; text-align: center; margin-top: 15px; }
      `}</style>

      <div className="app">
        <header className="header">
          <div className="logo">Exam<span>Pilot</span></div>
          {result && <button onClick={resetApp} style={{padding: "8px 20px", background: "transparent", border: "1px solid var(--border)", color: "white", borderRadius: "8px", cursor: "pointer"}}>New Plan</button>}
        </header>

        {!result ? (
          <div className="hero">
            <h1 style={{fontSize: "42px", marginBottom: "12px"}}>Paste your syllabus.<br/>Ace your exam.</h1>
            <p style={{color: "var(--text2)", fontSize: "18px", maxWidth: "500px", margin: "0 auto 40px"}}>ExamPilot turns any university exam notification into a complete personalized study plan in seconds.</p>

            <div className="form-container">
              <div className="input-group">
                <label>Syllabus / Exam Notification</label>
                <textarea
                  placeholder="Paste your full syllabus here...&#10;Example:&#10;Unit 1: Arrays, Linked Lists...&#10;Unit 2: Trees, BST..."
                  value={syllabus}
                  onChange={(e) => setSyllabus(e.target.value)}
                />
              </div>

              <div className="row">
                <div className="input-group">
                  <label>Exam Date</label>
                  <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Hours per day</label>
                  <input type="number" value={hoursPerDay} onChange={(e) => setHoursPerDay(Number(e.target.value))} min="1" max="12" />
                </div>
              </div>

              <div className="row">
                <div className="input-group">
                  <label>University (optional)</label>
                  <input type="text" placeholder="VIT Vellore / Mumbai University" value={university} onChange={(e) => setUniversity(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Subject (optional)</label>
                  <input type="text" placeholder="Data Structures" value={subject} onChange={(e) => setSubject(e.target.value)} />
                </div>
              </div>

              <button className="generate-btn" onClick={handleGenerate} disabled={loading}>
                {loading ? "Generating Your Personalized Plan..." : "Generate My Study Plan"}
              </button>

              {error && <p className="error">{error}</p>}
            </div>
          </div>
        ) : (
          <div style={{padding: "40px 20px", maxWidth: "900px", margin: "0 auto"}}>
            <div className="result" dangerouslySetInnerHTML={{ __html: result.plan.replace(/\n/g, '<br>') }} />
          </div>
        )}
      </div>
    </>
  );
}