import React, { useState, useEffect, useRef } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:3000";
// ── Icons ──────────────────────────────────────────────────────
const IconBolt = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IconBook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const IconCards = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z" />
  </svg>
);
const IconChat = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IconYT = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);
const IconFlip = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
);
const IconQuiz = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconClock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [summary, setSummary] = useState(null);
  const [flashcards, setFlashcards] = useState(null);
  const [timestamps, setTimestamps] = useState(null);
  const [flipped, setFlipped] = useState({});
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => { setSidebarOpen(false); }, [activeTab]);

  const extractVideoId = (u) => {
    const match = u.match(/(?:v=|youtu\.be\/|embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleProcess = async () => {
  if (!url.trim()) return;
  setLoading(true); setError(null); setSessionId(null);
  setSummary(null); setFlashcards(null); setTimestamps(null);
  setChatHistory([]); setFlipped({});

  // Wake up Render from sleep first
  try {
    await fetch(`${API}/health`);
    await new Promise(r => setTimeout(r, 2000));
  } catch(e) {}

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    const res = await fetch(`${API}/process-video`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    const data = await res.json();
    if (!res.ok) {
      setError(data.error === "Failed to get transcript"
        ? "This video has no captions. Try a video with CC/subtitles enabled."
        : data.error || "Failed to process video.");
      setLoading(false); return;
    }
    setSessionId(data.session_id);
    setLoading(false);
    setActiveTab("summary");
    setSummaryLoading(true);
    setFlashcardsLoading(true);
    fetchSummary(data.session_id);
    fetchFlashcards(data.session_id);
    fetchTimestamps(data.session_id);
  } catch(err) {
    if (err.name === "AbortError") {
      setError("Request timed out. The server is waking up — please try again in 30 seconds.");
    } else {
      setError("Cannot reach server. Make sure backend is running.");
    }
    setLoading(false);
  }
};

  const fetchSummary = async (sid) => {
    try {
      const res = await fetch(`${API}/summary`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid }),
      });
      const data = await res.json();
      setSummary(!res.ok ? `⚠️ ${data.error || "Could not generate summary."}` : data.summary);
    } catch {
      setSummary("⚠️ Failed to load summary. Check your connection.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchFlashcards = async (sid) => {
    try {
      const res = await fetch(`${API}/flashcards`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid }),
      });
      const data = await res.json();
      setFlashcards(!res.ok || !data.flashcards ? [] : data.flashcards);
    } catch {
      setFlashcards([]);
    } finally {
      setFlashcardsLoading(false);
    }
  };

  const fetchTimestamps = async (sid) => {
    try {
      const res = await fetch(`${API}/timestamps`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid }),
      });
      const data = await res.json();
      if (res.ok && data.timestamps) setTimestamps(data.timestamps);
    } catch { }
  };

  const handleAsk = async () => {
    if (!question.trim() || !sessionId || qaLoading) return;
    const q = question.trim(); setQuestion("");
    setChatHistory(h => [...h, { role: "user", text: q }]);
    setQaLoading(true);
    try {
      const res = await fetch(`${API}/ask`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, question: q }),
      });
      const data = await res.json();
      setChatHistory(h => [...h, { role: "ai", text: !res.ok ? `⚠️ ${data.error || "Failed."}` : data.answer }]);
    } catch {
      setChatHistory(h => [...h, { role: "ai", text: "⚠️ Network error. Check your connection." }]);
    }
    setQaLoading(false);
  };

  const resetApp = () => {
    setSessionId(null); setUrl(""); setSummary(null);
    setFlashcards(null); setTimestamps(null);
    setChatHistory([]); setFlipped({}); setSidebarOpen(false);
  };

  const tabs = [
    { id: "summary", label: "Summary", icon: <IconBook /> },
    { id: "flashcards", label: "Flashcards", icon: <IconCards /> },
    { id: "qa", label: "Ask AI", icon: <IconChat /> },
  ];

  const videoId = extractVideoId(url);
  const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  const flippedCount = Object.values(flipped).filter(Boolean).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');
        :root {
          --bg:#080810;--bg2:#0e0e1a;--bg3:#13131f;
          --border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.12);
          --accent:#7c6aff;--accent2:#a78bff;--accent-glow:rgba(124,106,255,0.3);
          --green:#22d3a0;--red:#ff6b8a;
          --text:#f0f0fa;--text2:#9090b0;--text3:#5a5a7a;
          --card-hover:rgba(255,255,255,0.055);--radius:16px;--radius-sm:10px;
        }
        *{margin:0;padding:0;box-sizing:border-box;}
        html{scroll-behavior:smooth;}
        body{background:var(--bg);font-family:'DM Sans',sans-serif;color:var(--text);min-height:100vh;overflow-x:hidden;}
        .bg-grid{position:fixed;inset:0;z-index:0;background-image:linear-gradient(rgba(124,106,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,106,255,0.03) 1px,transparent 1px);background-size:60px 60px;pointer-events:none;}
        .bg-orb1{position:fixed;width:600px;height:600px;background:radial-gradient(circle,rgba(124,106,255,0.12) 0%,transparent 70%);top:-200px;right:-200px;pointer-events:none;z-index:0;}
        .bg-orb2{position:fixed;width:400px;height:400px;background:radial-gradient(circle,rgba(34,211,160,0.08) 0%,transparent 70%);bottom:-100px;left:-100px;pointer-events:none;z-index:0;}
        .app{position:relative;z-index:1;min-height:100vh;display:flex;flex-direction:column;}
        .header{display:flex;align-items:center;justify-content:space-between;padding:16px 40px;border-bottom:1px solid var(--border);backdrop-filter:blur(20px);background:rgba(8,8,16,0.8);position:sticky;top:0;z-index:100;}
        .logo{display:flex;align-items:center;gap:10px;font-family:'Syne',sans-serif;font-weight:800;font-size:20px;letter-spacing:-0.5px;}
        .logo-icon{width:34px;height:34px;background:linear-gradient(135deg,var(--accent),var(--accent2));border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;}
        .logo span{color:var(--accent2);}
        .badge{font-size:11px;font-weight:500;background:rgba(124,106,255,0.15);color:var(--accent2);border:1px solid rgba(124,106,255,0.2);padding:3px 10px;border-radius:20px;letter-spacing:0.5px;}
        .menu-btn{display:none;background:none;border:none;color:var(--text2);cursor:pointer;padding:4px;}
        .hero{display:flex;flex-direction:column;align-items:center;padding:80px 24px 60px;text-align:center;opacity:0;transform:translateY(20px);animation:fadeUp 0.6s ease forwards;}
        @keyframes fadeUp{to{opacity:1;transform:translateY(0);}}
        .hero-eyebrow{display:flex;align-items:center;gap:6px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:var(--accent2);font-weight:500;background:rgba(124,106,255,0.08);border:1px solid rgba(124,106,255,0.15);padding:6px 16px;border-radius:20px;margin-bottom:28px;}
        .hero h1{font-family:'Syne',sans-serif;font-size:clamp(36px,6vw,72px);font-weight:800;line-height:1.05;letter-spacing:-2px;margin-bottom:20px;}
        .hero h1 .gradient{background:linear-gradient(135deg,var(--accent) 0%,var(--accent2) 50%,var(--green) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .hero p{font-size:17px;color:var(--text2);max-width:480px;line-height:1.6;font-weight:300;margin-bottom:44px;}
        .input-wrapper{width:100%;max-width:640px;background:var(--bg3);border:1px solid var(--border2);border-radius:20px;padding:8px 8px 8px 20px;display:flex;align-items:center;gap:12px;transition:border-color 0.2s,box-shadow 0.2s;}
        .input-wrapper:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-glow);}
        .input-yt-icon{color:#ff4444;flex-shrink:0;}
        .url-input{flex:1;background:none;border:none;outline:none;color:var(--text);font-size:15px;font-family:'DM Sans',sans-serif;min-width:0;}
        .url-input::placeholder{color:var(--text3);}
        .process-btn{display:flex;align-items:center;gap:8px;padding:12px 24px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;border:none;border-radius:14px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:600;cursor:pointer;white-space:nowrap;transition:opacity 0.2s,transform 0.15s,box-shadow 0.2s;box-shadow:0 4px 20px rgba(124,106,255,0.4);flex-shrink:0;}
        .process-btn:hover:not(:disabled){opacity:0.9;transform:translateY(-1px);box-shadow:0 6px 24px rgba(124,106,255,0.5);}
        .process-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
        .error-msg{margin-top:16px;color:var(--red);font-size:13px;display:flex;align-items:center;gap:6px;max-width:640px;text-align:center;}
        .loading-bar{width:100%;max-width:640px;height:2px;background:var(--border);border-radius:2px;margin-top:20px;overflow:hidden;}
        .loading-bar-fill{height:100%;background:linear-gradient(90deg,var(--accent),var(--green));border-radius:2px;animation:loadSlide 1.5s ease-in-out infinite;}
        @keyframes loadSlide{0%{transform:translateX(-100%);}100%{transform:translateX(400%);}}
        .workspace{max-width:1100px;width:100%;margin:0 auto;padding:24px 24px 80px;display:grid;grid-template-columns:280px 1fr;gap:24px;align-items:start;animation:fadeUp 0.4s ease forwards;}
        .mobile-tabs{display:none;position:sticky;top:65px;z-index:50;background:rgba(8,8,16,0.95);border-bottom:1px solid var(--border);padding:0 16px;}
        .mobile-tab-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 8px;border:none;background:none;color:var(--text3);font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.15s;}
        .mobile-tab-btn.active{color:var(--accent2);border-bottom-color:var(--accent2);}
        .sidebar{display:flex;flex-direction:column;gap:16px;}
        .video-card{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;}
        .video-thumb{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:var(--bg2);}
        .video-thumb-placeholder{width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,var(--bg2),var(--bg3));display:flex;align-items:center;justify-content:center;color:var(--text3);}
        .video-info{padding:14px 16px;}
        .video-label{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:var(--accent2);font-weight:600;margin-bottom:6px;}
        .video-id{font-size:13px;color:var(--text2);word-break:break-all;font-family:monospace;}
        .nav-card{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:8px;display:flex;flex-direction:column;gap:4px;}
        .nav-btn{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:var(--radius-sm);border:none;background:none;color:var(--text2);font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;text-align:left;transition:all 0.15s;position:relative;}
        .nav-btn:hover{background:var(--card-hover);color:var(--text);}
        .nav-btn.active{background:rgba(124,106,255,0.12);color:var(--accent2);}
        .nav-btn.active::before{content:'';position:absolute;left:0;top:25%;bottom:25%;width:3px;background:var(--accent2);border-radius:0 3px 3px 0;}
        .nav-dot{margin-left:auto;width:6px;height:6px;background:var(--green);border-radius:50%;animation:pulse 2s infinite;}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
        .stats-card{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .stat{text-align:center;}
        .stat-val{font-family:'Syne',sans-serif;font-size:22px;font-weight:700;color:var(--accent2);}
        .stat-label{font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-top:2px;}
        .main-panel{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;min-height:520px;}
        .panel-header{padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
        .panel-title{font-family:'Syne',sans-serif;font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;}
        .panel-title .dot{width:8px;height:8px;background:var(--accent2);border-radius:50%;box-shadow:0 0 8px var(--accent);}
        .panel-body{padding:24px;}
        .summary-text{line-height:1.85;color:var(--text2);font-size:15px;white-space:pre-wrap;font-weight:300;}
        .summary-error{color:var(--red);font-size:14px;line-height:1.6;}
        .timestamps-section{margin-bottom:24px;}
        .timestamps-label{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:var(--text3);margin-bottom:12px;font-weight:600;display:flex;align-items:center;gap:6px;}
        .timestamps-list{display:flex;flex-wrap:wrap;gap:8px;}
        .timestamp-chip{display:flex;align-items:center;gap:7px;padding:6px 12px;border-radius:20px;background:rgba(124,106,255,0.08);border:1px solid rgba(124,106,255,0.2);color:var(--accent2);font-size:13px;text-decoration:none;transition:all 0.15s;cursor:pointer;}
        .timestamp-chip:hover{background:rgba(124,106,255,0.18);border-color:var(--accent);transform:translateY(-1px);}
        .timestamp-time{font-family:monospace;font-size:11px;color:var(--green);font-weight:600;}
        .skeleton{background:linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px;}
        @keyframes shimmer{0%{background-position:200% 0;}100%{background-position:-200% 0;}}
        .skeleton-line{height:14px;margin-bottom:12px;}
        .fc-controls{display:flex;align-items:center;gap:12px;margin-bottom:24px;flex-wrap:wrap;}
        .fc-toggle{display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:var(--radius-sm);border:1px solid var(--border2);background:none;color:var(--text2);font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer;transition:all 0.15s;}
        .fc-toggle:hover{border-color:var(--accent);color:var(--accent2);}
        .fc-toggle.active{background:rgba(124,106,255,0.1);border-color:var(--accent);color:var(--accent2);}
        .fc-count{margin-left:auto;font-size:13px;color:var(--text3);}
        .fc-progress{font-size:12px;color:var(--green);}
        .fc-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .fc-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:20px;min-height:140px;display:flex;flex-direction:column;justify-content:space-between;cursor:pointer;transition:all 0.2s;position:relative;overflow:hidden;}
        .fc-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--accent),var(--accent2));opacity:0;transition:opacity 0.2s;}
        .fc-card:hover{border-color:var(--border2);transform:translateY(-2px);}
        .fc-card:hover::before{opacity:1;}
        .fc-card.answer{border-color:rgba(34,211,160,0.2);}
        .fc-card.answer::before{background:var(--green);opacity:1;}
        .fc-type{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--accent2);font-weight:600;margin-bottom:10px;}
        .fc-card.answer .fc-type{color:var(--green);}
        .fc-text{font-size:14px;color:var(--text);line-height:1.55;flex:1;}
        .fc-hint{font-size:11px;color:var(--text3);margin-top:12px;display:flex;align-items:center;gap:4px;}
        .fc-empty{text-align:center;padding:40px;color:var(--text3);font-size:14px;line-height:1.6;}
        .quiz-wrap{text-align:center;padding:20px 0;}
        .quiz-progress{font-size:12px;color:var(--text3);margin-bottom:20px;text-transform:uppercase;letter-spacing:1px;}
        .quiz-q{font-family:'Syne',sans-serif;font-size:20px;font-weight:600;line-height:1.4;margin-bottom:32px;color:var(--text);}
        .quiz-reveal-btn{padding:12px 32px;border-radius:var(--radius-sm);background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;border:none;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:600;cursor:pointer;box-shadow:0 4px 20px var(--accent-glow);transition:all 0.2s;}
        .quiz-reveal-btn:hover{transform:translateY(-1px);}
        .quiz-answer{background:rgba(34,211,160,0.08);border:1px solid rgba(34,211,160,0.2);border-radius:var(--radius);padding:20px;margin:20px 0;color:var(--text);font-size:15px;line-height:1.6;}
        .quiz-nav{display:flex;gap:12px;justify-content:center;margin-top:20px;flex-wrap:wrap;}
        .quiz-nav-btn{padding:10px 24px;border-radius:var(--radius-sm);border:1px solid var(--border2);background:none;color:var(--text2);font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;transition:all 0.15s;}
        .quiz-nav-btn:hover{border-color:var(--accent);color:var(--accent2);}
        .chat-area{min-height:300px;max-height:400px;overflow-y:auto;margin-bottom:16px;display:flex;flex-direction:column;gap:16px;}
        .chat-area::-webkit-scrollbar{width:4px;}
        .chat-area::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px;}
        .chat-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text3);gap:12px;padding:40px;text-align:center;}
        .chat-empty-icon{width:48px;height:48px;background:var(--bg2);border:1px solid var(--border);border-radius:14px;display:flex;align-items:center;justify-content:center;color:var(--accent2);}
        .chat-empty p{font-size:14px;line-height:1.6;max-width:280px;}
        .chat-bubble{display:flex;gap:10px;}
        .chat-bubble.user{flex-direction:row-reverse;}
        .bubble-avatar{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;}
        .bubble-avatar.ai{background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;}
        .bubble-avatar.user{background:var(--bg2);border:1px solid var(--border2);color:var(--text2);}
        .bubble-text{max-width:80%;padding:12px 16px;border-radius:14px;font-size:14px;line-height:1.65;}
        .chat-bubble.ai .bubble-text{background:var(--bg2);border:1px solid var(--border);color:var(--text2);border-bottom-left-radius:4px;}
        .chat-bubble.user .bubble-text{background:rgba(124,106,255,0.12);border:1px solid rgba(124,106,255,0.2);color:var(--text);border-bottom-right-radius:4px;}
        .typing-dot{display:inline-block;width:6px;height:6px;background:var(--accent2);border-radius:50%;animation:typingBounce 1.2s infinite;margin:0 2px;}
        .typing-dot:nth-child(2){animation-delay:0.2s;}
        .typing-dot:nth-child(3){animation-delay:0.4s;}
        @keyframes typingBounce{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-6px);}}
        .suggestions{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;}
        .suggestion-chip{padding:6px 14px;border-radius:20px;border:1px solid var(--border2);background:none;color:var(--text2);font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;transition:all 0.15s;}
        .suggestion-chip:hover{border-color:var(--accent);color:var(--accent2);background:rgba(124,106,255,0.05);}
        .chat-input-row{display:flex;gap:10px;align-items:flex-end;}
        .chat-input{flex:1;padding:12px 16px;background:var(--bg2);border:1px solid var(--border2);border-radius:12px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color 0.2s;min-width:0;}
        .chat-input:focus{border-color:var(--accent);}
        .chat-input::placeholder{color:var(--text3);}
        .send-btn{width:44px;height:44px;flex-shrink:0;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;border-radius:12px;color:white;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;box-shadow:0 2px 12px var(--accent-glow);}
        .send-btn:hover:not(:disabled){transform:translateY(-1px);}
        .send-btn:disabled{opacity:0.4;cursor:not-allowed;}
        .sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:200;backdrop-filter:blur(4px);}
        .sidebar-overlay.open{display:block;}
        .sidebar-drawer{position:fixed;top:0;left:0;bottom:0;width:280px;background:var(--bg2);border-right:1px solid var(--border2);z-index:201;padding:20px 16px;display:flex;flex-direction:column;gap:16px;transform:translateX(-100%);transition:transform 0.3s ease;overflow-y:auto;}
        .sidebar-drawer.open{transform:translateX(0);}
        .drawer-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;}
        .drawer-close{background:none;border:none;color:var(--text2);cursor:pointer;padding:4px;}
        @media(max-width:768px){
          .header{padding:14px 16px;}.badge{display:none;}.menu-btn{display:flex;}
          .hero{padding:44px 16px 36px;}.hero-eyebrow{font-size:11px;padding:5px 12px;}
          .hero h1{font-size:36px;letter-spacing:-1.5px;}.hero p{font-size:15px;margin-bottom:32px;}
          .input-wrapper{border-radius:16px;padding:6px 6px 6px 14px;}.url-input{font-size:14px;}
          .process-btn{padding:10px 16px;font-size:14px;border-radius:12px;}.btn-text{display:none;}
          .workspace{grid-template-columns:1fr;padding:0 0 80px;gap:0;}.sidebar{display:none;}
          .mobile-tabs{display:flex;}
          .main-panel{border-radius:0;border-left:none;border-right:none;min-height:calc(100vh - 130px);}
          .panel-header{padding:16px;}.panel-body{padding:16px;}
          .fc-grid{grid-template-columns:1fr;}
          .chat-area{min-height:250px;max-height:350px;}
          .bubble-text{max-width:90%;font-size:13px;}
          .quiz-q{font-size:17px;}.suggestions{gap:6px;}
          .suggestion-chip{font-size:11px;padding:5px 10px;}
          .timestamps-list{gap:6px;}.timestamp-chip{font-size:12px;padding:5px 10px;}
        }
        @media(max-width:400px){.hero h1{font-size:28px;}.hero p{font-size:13px;}}
        ::-webkit-scrollbar{width:6px;height:6px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px;}
      `}</style>

      <div className="bg-grid" /><div className="bg-orb1" /><div className="bg-orb2" />

      {/* Mobile Drawer */}
      {sessionId && (
        <>
          <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />
          <div className={`sidebar-drawer ${sidebarOpen ? "open" : ""}`}>
            <div className="drawer-header">
              <div className="logo" style={{ fontSize: 16 }}>
                <div className="logo-icon" style={{ width: 28, height: 28 }}><IconBolt /></div>
                Lect<span>AI</span>
              </div>
              <button className="drawer-close" onClick={() => setSidebarOpen(false)}><IconX /></button>
            </div>
            <div className="video-card">
              {thumbUrl ? <img className="video-thumb" src={thumbUrl} alt="thumb" /> : <div className="video-thumb-placeholder"><IconYT /></div>}
              <div className="video-info">
                <div className="video-label">Now studying</div>
                <div className="video-id">{videoId}</div>
              </div>
            </div>
            <div className="stats-card">
              <div className="stat"><div className="stat-val">{flashcards ? flashcards.length : "—"}</div><div className="stat-label">Cards</div></div>
              <div className="stat"><div className="stat-val">{flippedCount}</div><div className="stat-label">Studied</div></div>
            </div>
            <button className="process-btn" style={{ width: "100%", justifyContent: "center", borderRadius: 12 }} onClick={resetApp}>← New Video</button>
          </div>
        </>
      )}

      <div className="app">
        <header className="header">
          <div className="logo">
            <div className="logo-icon"><IconBolt /></div>
            Lect<span>AI</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="badge">BETA</div>
            {sessionId && <button className="menu-btn" onClick={() => setSidebarOpen(true)}><IconMenu /></button>}
          </div>
        </header>

        {/* ── Hero ── */}
        {!sessionId && (
          <div className="hero">
            <div className="hero-eyebrow"><IconBolt /> AI-Powered Learning</div>
            <h1>Learn any lecture<br /><span className="gradient">in minutes</span></h1>
            <p>Paste a YouTube lecture URL and instantly get summaries, flashcards, and an AI tutor.</p>
            <div className="input-wrapper">
              <span className="input-yt-icon"><IconYT /></span>
              <input className="url-input" type="text" placeholder="https://youtube.com/watch?v=..."
                value={url} onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleProcess()} />
              <button className="process-btn" onClick={handleProcess} disabled={loading}>
                <IconBolt /><span className="btn-text">{loading ? "Processing…" : "Process"}</span>
              </button>
            </div>
            {loading && <div className="loading-bar"><div className="loading-bar-fill" /></div>}
            {error && <div className="error-msg">⚠ {error}</div>}
          </div>
        )}

        {/* ── Workspace ── */}
        {sessionId && (
          <div className="workspace">

            {/* Desktop Sidebar */}
            <div className="sidebar">
              <div className="video-card">
                {thumbUrl ? <img className="video-thumb" src={thumbUrl} alt="thumb" /> : <div className="video-thumb-placeholder"><IconYT /></div>}
                <div className="video-info">
                  <div className="video-label">Now studying</div>
                  <div className="video-id">{videoId}</div>
                </div>
              </div>
              <div className="nav-card">
                {tabs.map(t => (
                  <button key={t.id} className={`nav-btn ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
                    {t.icon} {t.label}
                    {t.id === "summary" && summary && !summary.startsWith("⚠") && <span className="nav-dot" />}
                  </button>
                ))}
              </div>
              <div className="stats-card">
                <div className="stat"><div className="stat-val">{flashcards ? flashcards.length : "—"}</div><div className="stat-label">Cards</div></div>
                <div className="stat"><div className="stat-val">{flippedCount}</div><div className="stat-label">Studied</div></div>
              </div>
              <button className="process-btn" style={{ width: "100%", justifyContent: "center", borderRadius: 12 }} onClick={resetApp}>← New Video</button>
            </div>

            {/* Mobile Tab Bar */}
            <div className="mobile-tabs">
              {tabs.map(t => (
                <button key={t.id} className={`mobile-tab-btn ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Main Panel */}
            <div className="main-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <span className="dot" />
                  {activeTab === "summary" && "AI Summary"}
                  {activeTab === "flashcards" && "Flashcards"}
                  {activeTab === "qa" && "Ask the AI Tutor"}
                </div>
                {activeTab === "flashcards" && flashcards && flashcards.length > 0 && (
                  <button className={`fc-toggle ${quizMode ? "active" : ""}`}
                    onClick={() => { setQuizMode(!quizMode); setQuizIndex(0); setQuizAnswered(false); }}>
                    <IconQuiz /> {quizMode ? "Exit Quiz" : "Quiz Mode"}
                  </button>
                )}
              </div>

              <div className="panel-body">

                {/* ── Summary Tab ── */}
                {activeTab === "summary" && (
                  summaryLoading ? (
                    <div>{[100,90,80,95,70,60,85].map((w,i) => (
                      <div key={i} className="skeleton skeleton-line" style={{ width: `${w}%` }} />
                    ))}</div>
                  ) : summary?.startsWith("⚠") ? (
                    <div className="summary-error">{summary}</div>
                  ) : (
                    <>
                      {/* Timestamps */}
                      {timestamps && timestamps.length > 0 && (
                        <div className="timestamps-section">
                          <div className="timestamps-label">
                            <IconClock /> Key Moments
                          </div>
                          <div className="timestamps-list">
                            {timestamps.map((t, i) => (
                              <a
                                key={i}
                                className="timestamp-chip"
                                href={`https://youtube.com/watch?v=${videoId}&t=${Math.floor(t.time)}s`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <span className="timestamp-time">{formatTime(t.time)}</span>
                                {t.label}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="summary-text">{summary}</div>
                    </>
                  )
                )}

                {/* ── Flashcards Tab ── */}
                {activeTab === "flashcards" && (
                  flashcardsLoading ? (
                    <div className="fc-grid">{[...Array(4)].map((_,i) => (
                      <div key={i} className="skeleton" style={{ height: 140, borderRadius: 16 }} />
                    ))}</div>
                  ) : !flashcards || flashcards.length === 0 ? (
                    <div className="fc-empty">⚠️ Could not generate flashcards.<br />Try a longer educational video.</div>
                  ) : quizMode ? (
                    <div className="quiz-wrap">
                      <div className="quiz-progress">Question {quizIndex + 1} of {flashcards.length}</div>
                      <div className="quiz-q">{flashcards[quizIndex].question}</div>
                      {!quizAnswered ? (
                        <button className="quiz-reveal-btn" onClick={() => setQuizAnswered(true)}>Reveal Answer</button>
                      ) : (
                        <>
                          <div className="quiz-answer">{flashcards[quizIndex].answer}</div>
                          <div className="quiz-nav">
                            {quizIndex < flashcards.length - 1 ? (
                              <button className="quiz-nav-btn" onClick={() => { setQuizIndex(i => i+1); setQuizAnswered(false); }}>Next →</button>
                            ) : (
                              <button className="quiz-nav-btn" onClick={() => { setQuizIndex(0); setQuizAnswered(false); }}>Restart</button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="fc-controls">
                        <span className="fc-progress">{flippedCount > 0 ? `${flippedCount}/${flashcards.length} studied` : "Tap a card to flip"}</span>
                        <span className="fc-count">{flashcards.length} cards</span>
                      </div>
                      <div className="fc-grid">
                        {flashcards.map((fc, i) => (
                          <div key={i} className={`fc-card ${flipped[i] ? "answer" : ""}`}
                            onClick={() => setFlipped(f => ({ ...f, [i]: !f[i] }))}>
                            <div>
                              <div className="fc-type">{flipped[i] ? "Answer" : "Question"}</div>
                              <div className="fc-text">{flipped[i] ? fc.answer : fc.question}</div>
                            </div>
                            <div className="fc-hint"><IconFlip /> {flipped[i] ? "Tap for question" : "Tap to reveal"}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )
                )}

                {/* ── Q&A Tab ── */}
                {activeTab === "qa" && (
                  <>
                    <div className="chat-area">
                      {chatHistory.length === 0 ? (
                        <div className="chat-empty">
                          <div className="chat-empty-icon"><IconChat /></div>
                          <p>Ask anything about this lecture. The AI has read the full transcript.</p>
                        </div>
                      ) : (
                        chatHistory.map((msg, i) => (
                          <div key={i} className={`chat-bubble ${msg.role}`}>
                            <div className={`bubble-avatar ${msg.role}`}>{msg.role === "ai" ? "AI" : "U"}</div>
                            <div className="bubble-text">{msg.text}</div>
                          </div>
                        ))
                      )}
                      {qaLoading && (
                        <div className="chat-bubble ai">
                          <div className="bubble-avatar ai">AI</div>
                          <div className="bubble-text">
                            <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    {chatHistory.length === 0 && (
                      <div className="suggestions">
                        {["What is the main topic?","Summarize key points","What should I study first?","Give me 3 important concepts"].map(s => (
                          <button key={s} className="suggestion-chip" onClick={() => setQuestion(s)}>{s}</button>
                        ))}
                      </div>
                    )}
                    <div className="chat-input-row">
                      <input ref={inputRef} className="chat-input"
                        placeholder="Ask anything about this lecture…"
                        value={question} onChange={e => setQuestion(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleAsk()} />
                      <button className="send-btn" onClick={handleAsk} disabled={qaLoading || !question.trim()}>
                        <IconSend />
                      </button>
                    </div>
                  </>
                )}

              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}